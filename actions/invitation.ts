"use server";

import { randomBytes } from "node:crypto";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import { getActionAuthContext, getActionErrorMessage, AuthorizationError } from "@/lib/authz";
import { sendEmployeeInvitationEmail } from "@/lib/email";

const INVITE_EXPIRY_DAYS = 7;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

function inviteExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return d;
}

// ---------------------------------------------------------------------------
// Resend invitation
// ---------------------------------------------------------------------------

export async function resendInvitation(userId: string) {
  try {
    const { user: currentUser } = await getActionAuthContext("employees.manage");

    const invitation = await prisma.employeeInvitation.findFirst({
      where: {
        userId,
        tenantId: currentUser.tenantId,
        status: "PENDING",
      },
      include: {
        user: { select: { name: true, email: true } },
        tenant: { select: { name: true } },
      },
    });

    if (!invitation) {
      return { error: "No pending invitation found for this employee." };
    }

    // Rotate the token and reset expiry
    const newToken = generateInviteToken();
    const newExpiry = inviteExpiresAt();

    await prisma.employeeInvitation.update({
      where: { id: invitation.id },
      data: { token: newToken, expiresAt: newExpiry },
    });

    const inviteUrl = `${APP_URL}/invite/${newToken}`;

    await sendEmployeeInvitationEmail({
      to: invitation.user.email,
      inviteeName: invitation.user.name,
      inviterName: currentUser.name,
      companyName: invitation.tenant.name,
      inviteUrl,
    });

    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to resend invitation.") };
  }
}

// ---------------------------------------------------------------------------
// Accept invitation (called from the public invite page)
// ---------------------------------------------------------------------------

const acceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function acceptInvitation(data: z.infer<typeof acceptSchema>) {
  const result = acceptSchema.safeParse(data);
  if (!result.success) {
    return { error: result.data === undefined ? result.error.issues[0].message : "Invalid input." };
  }

  const { token, password } = result.data;

  try {
    const invitation = await prisma.employeeInvitation.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!invitation) {
      return { error: "This invitation link is invalid." };
    }

    if (invitation.status !== "PENDING") {
      return { error: "This invitation has already been accepted or has expired." };
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.employeeInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return { error: "This invitation link has expired. Please ask your admin to resend it." };
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      // Create or update the credential account row
      const existing = await tx.account.findFirst({
        where: { userId: invitation.userId, providerId: "credential" },
      });

      if (existing) {
        await tx.account.update({
          where: { id: existing.id },
          data: { password: passwordHash },
        });
      } else {
        await tx.account.create({
          data: {
            id: randomUUID(),
            accountId: invitation.userId,
            providerId: "credential",
            userId: invitation.userId,
            password: passwordHash,
          },
        });
      }

      await tx.user.update({
        where: { id: invitation.userId },
        data: { emailVerified: true },
      });

      await tx.employeeInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
    });

    return { success: true, email: invitation.user.email };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to accept invitation.") };
  }
}

// ---------------------------------------------------------------------------
// Get invitation details (for the public invite page rendering)
// ---------------------------------------------------------------------------

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.employeeInvitation.findUnique({
    where: { token },
    select: {
      status: true,
      expiresAt: true,
      user: { select: { name: true, email: true } },
      tenant: { select: { name: true } },
    },
  });

  if (!invitation) return null;

  return {
    status: invitation.status,
    isExpired: invitation.expiresAt < new Date(),
    userName: invitation.user.name,
    userEmail: invitation.user.email,
    tenantName: invitation.tenant.name,
  };
}

// ---------------------------------------------------------------------------
// Internal helper used by createEmployee action
// ---------------------------------------------------------------------------

export async function createAndSendInvitation({
  userId,
  tenantId,
  inviterName,
  tenantName,
  userEmail,
  userName,
}: {
  userId: string;
  tenantId: string;
  inviterName: string;
  tenantName: string;
  userEmail: string;
  userName: string;
}) {
  const token = generateInviteToken();
  const expiresAt = inviteExpiresAt();

  await prisma.employeeInvitation.create({
    data: {
      tenantId,
      userId,
      token,
      expiresAt,
      status: "PENDING",
    },
  });

  const inviteUrl = `${APP_URL}/invite/${token}`;

  await sendEmployeeInvitationEmail({
    to: userEmail,
    inviteeName: userName,
    inviterName,
    companyName: tenantName,
    inviteUrl,
  });
}
