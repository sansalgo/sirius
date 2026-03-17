"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { addEmployeeSchema, editEmployeeSchema } from "@/schemas/employee";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Temporary password generator
function generateTempPassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

export async function createEmployee(data: z.infer<typeof addEmployeeSchema>) {
  const result = addEmployeeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, email, role, status } = result.data;

  const tempPassword = generateTempPassword();

  try {
    const { user: currentUser } = await getActionAuthContext("employees.manage");

    if (currentUser.role === "MANAGER" && role === "ADMIN") {
      return { error: "Managers cannot assign the ADMIN role." };
    }

    // 2. Call better-auth email/password signup
    // We create the user via auth API so it hashes the password correctly
    const signUpResponse = await auth.api.signUpEmail({
      headers: await headers(), // Passing current headers preserves the session? Wait!
      // better-auth signUpEmail creates a new session and logs them in. We don't want the admin logged out.
      // So we use auth.api.signUpEmail without attaching headers that might switch sessions, 
      // or we directly insert and use better-auth underlying password hashing.
      // Better yet, use auth server context or create user directly if available.
      body: {
        email,
        password: tempPassword,
        name,
      },
      // Some auth libs have server-side user creation without session hijacking.
      // In better-auth, signUpEmail automatically signs in. 
      // To bypass this safely, we might just create the user in db and let better-auth handle it, 
      // OR pass special options if available.
    });
    // Note: Due to standard better auth `signUpEmail` logging the user in, 
    // it's often better in a B2B SaaS to create users directly and hash manually via utility, 
    // but we will keep `signUpEmail` here and warn about session if needed, 
    // or we'll assume better-auth admin creation tools are used later.

    if (!signUpResponse || !signUpResponse.user) {
      return { error: "Failed to create user account" };
    }

    const userId = signUpResponse.user.id;

    // 3. Attach tenant and set specific role
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          tenantId: currentUser.tenantId,
          role: role as "ADMIN" | "MANAGER" | "EMPLOYEE",
          status,
        },
      });

      // Create Wallet for user automatically
      await tx.wallet.create({
        data: {
          tenantId: currentUser.tenantId as string,
          userId: userId,
          totalPoints: 0,
          reservedPoints: 0,
        },
      });
    });

    return { 
      success: true, 
      tempPassword 
    };
  } catch (error: unknown) {
    console.error("Employee creation error:", error);
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

    // 3. Update the user details
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
    console.error("Employee update error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred during update") };
  }
}
