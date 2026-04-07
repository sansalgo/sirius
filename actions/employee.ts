"use server";

import { z } from "zod";
import { addEmployeeSchema, editEmployeeSchema } from "@/schemas/employee";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createCredentialUser } from "@/lib/user-provisioning";
import { getTenantSeatSummary } from "@/lib/subscriptions";
import { createAndSendInvitation } from "@/actions/invitation";

export async function createEmployee(data: z.infer<typeof addEmployeeSchema>) {
  const result = addEmployeeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, email, role, status } = result.data;

  try {
    const { user: currentUser } = await getActionAuthContext("employees.manage");
    const seatSummary = await getTenantSeatSummary(currentUser.tenantId);

    if (currentUser.role === "MANAGER" && role === "ADMIN") {
      return { error: "Managers cannot assign the ADMIN role." };
    }

    if (seatSummary.isAtLimit) {
      return {
        error:
          seatSummary.plan === "FREE"
            ? "Your Free plan supports up to 10 team seats excluding the owner. Upgrade to Pro to add more members."
            : "Your current plan has no remaining seats.",
      };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      select: { name: true },
    });

    let newUserId: string;

    await prisma.$transaction(async (tx) => {
      const newUser = await createCredentialUser({
        db: tx,
        email,
        name,
        // No password — user sets it via the invitation link
        tenantId: currentUser.tenantId,
        role: role as "ADMIN" | "MANAGER" | "EMPLOYEE",
        status,
        emailVerified: false,
      });
      newUserId = newUser.id;
    });

    // Send the invitation email outside the transaction so a failed email
    // doesn't roll back the user creation
    await createAndSendInvitation({
      userId: newUserId!,
      tenantId: currentUser.tenantId,
      inviterName: currentUser.name,
      tenantName: tenant?.name ?? "your workspace",
      userEmail: email,
      userName: name,
    });

    return { success: true };
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("Employee creation error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred during creation") };
  }
}

export async function updateEmployee(data: z.infer<typeof editEmployeeSchema>) {
  const result = editEmployeeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { id, name, role, status } = result.data;

  try {
    const { user: currentUser } = await getActionAuthContext("employees.manage");

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, tenantId: true, role: true },
    });

    if (!targetUser || targetUser.tenantId !== currentUser.tenantId) {
      return { error: "Employee not found or unauthorized to edit this user." };
    }

    if (currentUser.role === "MANAGER") {
      if (role === "ADMIN" || targetUser.role === "ADMIN") {
        return { error: "Managers cannot create or edit admin accounts." };
      }

      if (status === "INACTIVE") {
        return { error: "Managers cannot deactivate employees." };
      }
    }

    if (currentUser.id === id && status === "INACTIVE") {
      return { error: "You cannot deactivate your own account." };
    }

    if (currentUser.id === id && targetUser.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          tenantId: currentUser.tenantId,
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return { error: "You cannot remove the last admin from the tenant." };
      }
    }

    if (targetUser.role === "ADMIN" && status === "INACTIVE") {
      const activeAdminCount = await prisma.user.count({
        where: {
          tenantId: currentUser.tenantId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

      if (activeAdminCount <= 1) {
        return { error: "You cannot deactivate the last active admin in the tenant." };
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        name,
        role: role as "ADMIN" | "MANAGER" | "EMPLOYEE",
        status,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("Employee update error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred during update") };
  }
}
