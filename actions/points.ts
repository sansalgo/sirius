"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  allocatePointsSchema,
  redeemPointsSchema,
  adjustPointsSchema,
} from "@/schemas/points";

/**
 * Ensures a valid session and returns the current user along with their tenant and role.
 */
async function getAuthContext() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, role: true },
  });

  if (!currentUser?.tenantId) {
    throw new Error("You do not belong to a valid tenant organization.");
  }

  return {
    session,
    currentUser: {
      ...currentUser,
      tenantId: currentUser.tenantId,
    },
  };
}

/**
 * Allocate points from Manager/Owner/Admin to an active user
 */
export async function allocatePoints(data: z.infer<typeof allocatePointsSchema>) {
  const result = allocatePointsSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { toUserId, amount } = result.data;

  try {
    const { session, currentUser } = await getAuthContext();
    const { tenantId, role } = currentUser;

    if (role !== "OWNER" && role !== "ADMIN" && role !== "MANAGER") {
      return { error: "Insufficient permissions to allocate points." };
    }

    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { tenantId: true, status: true },
    });

    if (!toUser) {
      return { error: "Target user not found." };
    }

    if (toUser.tenantId !== tenantId) {
      return { error: "Target user does not belong to your organization." };
    }

    if (toUser.status !== "ACTIVE") {
      return { error: "Cannot allocate points to an inactive user." };
    }

    await prisma.$transaction(async (tx) => {
      // MANAGER logic checking
      if (role === "MANAGER") {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();

        const managerAllocation = await tx.managerAllocation.findUnique({
          where: {
            tenantId_managerId_month_year: {
              tenantId,
              managerId: session.user.id,
              month,
              year,
            },
          },
        });

        if (!managerAllocation) {
          throw new Error("Manager allocation for this month not found.");
        }

        if (managerAllocation.usedAmount + amount > managerAllocation.monthlyLimit) {
          throw new Error("Monthly point allocation limit exceeded.");
        }

        await tx.managerAllocation.update({
          where: { id: managerAllocation.id },
          data: {
            usedAmount: { increment: amount },
          },
        });
      }

      // Record point ledger
      await tx.pointLedger.create({
        data: {
          tenantId,
          fromUserId: session.user.id,
          toUserId,
          amount,
          type: "ALLOCATION",
        },
      });

      // Credit wallet
      await tx.wallet.upsert({
        where: {
          tenantId_userId: {
            tenantId,
            userId: toUserId,
          },
        },
        update: {
          totalPoints: { increment: amount },
        },
        create: {
          tenantId,
          userId: toUserId,
          totalPoints: amount,
          reservedPoints: 0,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Point allocation error:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}

/**
 * Redeem points manually (called by employees)
 */
export async function redeemPoints(data: z.infer<typeof redeemPointsSchema>) {
  const result = redeemPointsSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { amount } = result.data;

  try {
    const { session, currentUser } = await getAuthContext();
    const { tenantId, role } = currentUser;

    if (role !== "EMPLOYEE") {
      return { error: "Only employees can redeem points." };
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: session.user.id,
          },
        },
      });

      const availablePoints = (wallet?.totalPoints ?? 0) - (wallet?.reservedPoints ?? 0);
      if (!wallet || availablePoints < amount) {
        throw new Error("Insufficient point balance.");
      }

      await tx.pointLedger.create({
        data: {
          tenantId,
          fromUserId: null,
          toUserId: session.user.id,
          amount: -amount,
          type: "REWARD",
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          totalPoints: { decrement: amount },
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Point redemption error:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}

/**
 * Manual adjustment by OWNER/ADMIN
 */
export async function adjustPoints(data: z.infer<typeof adjustPointsSchema>) {
  const result = adjustPointsSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // reason mapped here but DB only has generic ledger fields.
  const { userId, amount, reason } = result.data; 

  try {
    const { session, currentUser } = await getAuthContext();
    const { tenantId, role } = currentUser;

    if (role !== "OWNER" && role !== "ADMIN") {
      return { error: "Insufficient permissions to adjust points." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!targetUser || targetUser.tenantId !== tenantId) {
      return { error: "Target user not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId,
          },
        },
      });

      if (amount < 0) {
        if (!wallet) {
          throw new Error("Cannot adjust points because wallet was not found.");
        }
        if (wallet.totalPoints + amount < wallet.reservedPoints) {
          throw new Error("Cannot reduce total points below reserved points.");
        }
      }

      // Record point ledger
      await tx.pointLedger.create({
        data: {
          tenantId,
          fromUserId: session.user.id,
          toUserId: userId,
          amount,
          type: "ADJUSTMENT",
        },
      });

      // Adjust wallet
      await tx.wallet.upsert({
        where: {
          tenantId_userId: {
            tenantId,
            userId,
          },
        },
        update: {
          totalPoints: { increment: amount },
        },
        create: {
          tenantId,
          userId,
          totalPoints: amount > 0 ? amount : 0,
          reservedPoints: 0,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Point adjustment error:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}

/**
 * Returns total/reserved/available points and last 20 ledger entries for the logged in user
 */
export async function getUserBalance() {
  try {
    const { session, currentUser } = await getAuthContext();
    const { tenantId } = currentUser;

    const wallet = await prisma.wallet.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: session.user.id,
        },
      },
      select: { totalPoints: true, reservedPoints: true },
    });

    const entries = await prisma.pointLedger.findMany({
      where: {
        tenantId,
        toUserId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return { 
      success: true, 
      totalPoints: wallet?.totalPoints ?? 0,
      reservedPoints: wallet?.reservedPoints ?? 0,
      availablePoints: (wallet?.totalPoints ?? 0) - (wallet?.reservedPoints ?? 0),
      // Backward compatibility for pages still reading `balance`
      balance: (wallet?.totalPoints ?? 0) - (wallet?.reservedPoints ?? 0),
      entries 
    };
  } catch (error: any) {
    console.error("Get user balance error:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}
