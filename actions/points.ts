"use server";

import { z } from "zod";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getAllocationPeriod } from "@/lib/utils";
import { allocatePointsSchema } from "@/schemas/points";

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
    const { session, user: currentUser } = await getActionAuthContext("points.allocate");
    const { tenantId, role } = currentUser;

    const toUser = await prisma.user.findFirst({
      where: {
        id: toUserId,
        tenantId,
      },
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
      // MANAGER limit check with lazy allocation record creation.
      if (role === "MANAGER") {
        const tenantSettings = await tx.tenantSettings.upsert({
          where: { tenantId },
          update: {},
          create: { tenantId },
        });
        const { periodStart, periodEnd } = getAllocationPeriod(
          tenantSettings.managerAllocationFrequency
        );

        let managerAllocation = await tx.managerAllocation.findUnique({
          where: {
            tenantId_managerId_periodStart: {
              tenantId,
              managerId: session.user.id,
              periodStart,
            },
          },
        });

        if (!managerAllocation) {
          managerAllocation = await tx.managerAllocation.create({
            data: {
              tenantId,
              managerId: session.user.id,
              allocationLimit: tenantSettings.managerAllocationLimit,
              usedAmount: 0,
              periodStart,
              periodEnd,
            },
          });
        }

        if (managerAllocation.usedAmount + amount > managerAllocation.allocationLimit) {
          throw new Error("Allocation limit exceeded for the current period.");
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
  } catch (error: unknown) {
    console.error("Point allocation error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}

/**
 * Returns total/reserved/available points and last 20 ledger entries for the logged in user
 */
export async function getUserBalance() {
  try {
    const { session, user: currentUser } = await getActionAuthContext("points.view");
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
  } catch (error: unknown) {
    console.error("Get user balance error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}

