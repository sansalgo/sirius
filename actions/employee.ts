"use server";

import { z } from "zod";
import { addEmployeeSchema, editEmployeeSchema } from "@/schemas/employee";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createCredentialUser } from "@/lib/user-provisioning";
import { getTenantSeatSummary } from "@/lib/subscriptions";

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

    await prisma.$transaction(async (tx) => {
      await createCredentialUser({
        db: tx,
        email,
        name,
        password: tempPassword,
        tenantId: currentUser.tenantId,
        role: role as "ADMIN" | "MANAGER" | "EMPLOYEE",
        status,
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
