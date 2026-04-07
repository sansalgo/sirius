"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { signupSchema } from "@/schemas/auth";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCredentialUser } from "@/lib/user-provisioning";
import { getPlanSeatLimit } from "@/lib/subscriptions";
import { sendWelcomeEmail } from "@/lib/email";

export async function registerTenantAndUser(data: z.infer<typeof signupSchema>) {
  const result = signupSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { companyName, name, email, password } = result.data;

  try {
    const reqHeaders = await headers();
    const freePlanSeatLimit = getPlanSeatLimit("FREE");

    let ownerEmail = email;
    let ownerName = name;

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          subscriptionPlan: "FREE",
        },
      });

      const owner = await createCredentialUser({
        db: tx,
        email,
        name,
        password,
        tenantId: tenant.id,
        role: "ADMIN",
        status: "ACTIVE",
        // Tenant owners are trusted; mark email verified so they aren't blocked
        emailVerified: true,
      });

      ownerEmail = owner.email;
      ownerName = owner.name;

      await tx.tenant.update({
        where: { id: tenant.id },
        data: { ownerUserId: owner.id },
      });

      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          plan: "FREE",
          status: "ACTIVE",
          seatLimit: freePlanSeatLimit,
        },
      });
    });

    // Sign in before sending email so the redirect works even if email fails
    await auth.api.signInEmail({
      headers: reqHeaders,
      body: { email, password },
    });

    // Non-blocking — don't fail signup if email send fails
    sendWelcomeEmail({ to: ownerEmail, name: ownerName, companyName }).catch(() => {});

    return { success: true };
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") console.error("Signup error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during signup",
    };
  }
}
