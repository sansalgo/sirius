"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { signupSchema } from "@/schemas/auth";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function registerTenantAndUser(data: z.infer<typeof signupSchema>) {
  const result = signupSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { companyName, name, email, password } = result.data;

  try {
    // 2. Call better-auth email/password signup
    const reqHeaders = await headers();
    
    // Using the auth.api endpoints directly internally handles hashing and user creation
    const signUpResponse = await auth.api.signUpEmail({
      headers: reqHeaders,
      body: {
        email,
        password,
        name,
      },
    });

    if (!signUpResponse || !signUpResponse.user) {
      return { error: "Failed to create user account" };
    }

    const userId = signUpResponse.user.id;

    // 3. Wrap tenant creation + role update + wallet creation in a transaction
    await prisma.$transaction(async (tx) => {
      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          subscriptionPlan: "FREE",
        },
      });

      // Update created user with strictly assigned server-side role
      await tx.user.update({
        where: { id: userId },
        data: {
          tenantId: tenant.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

      // Create Wallet for user
      await tx.wallet.create({
        data: {
          tenantId: tenant.id,
          userId: userId,
          totalPoints: 0,
          reservedPoints: 0,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { error: error?.message || "An unexpected error occurred during signup" };
  }
}
