"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redeemRewardSchema, rejectRedemptionSchema } from "@/schemas/redemption";

async function getAuthContext() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true, role: true, name: true },
  });

  if (!currentUser?.tenantId) {
    throw new Error("You do not belong to a valid tenant organization.");
  }

  const tenantId = currentUser.tenantId;
  if (!tenantId) {
    throw new Error("You do not belong to a valid tenant organization.");
  }

  return {
    session,
    currentUser: {
      ...currentUser,
      tenantId,
    },
  };
}

export async function redeemRewardAction(data: z.infer<typeof redeemRewardSchema>) {
  const result = redeemRewardSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { rewardId } = result.data;

  try {
    const { session, currentUser } = await getAuthContext();
    const { tenantId, role } = currentUser;

    if (role !== "EMPLOYEE") {
      return { error: "Only employees can redeem rewards." };
    }

    const reward = await prisma.reward.findFirst({
      where: {
        id: rewardId,
        tenantId,
      },
      select: { id: true, pointsRequired: true, isActive: true },
    });

    if (!reward) {
      return { error: "Reward not found." };
    }

    if (!reward.isActive) {
      return { error: "Reward is inactive." };
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: session.user.id,
          },
        },
        select: { id: true, totalPoints: true, reservedPoints: true },
      });

      const availablePoints = (wallet?.totalPoints ?? 0) - (wallet?.reservedPoints ?? 0);
      if (!wallet || availablePoints < reward.pointsRequired) {
        throw new Error("Insufficient point balance.");
      }

      const redemption = await tx.rewardRedemption.create({
        data: {
          tenantId,
          userId: session.user.id,
          rewardId: reward.id,
          points: reward.pointsRequired,
          status: "PENDING",
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          reservedPoints: { increment: reward.pointsRequired },
        },
      });

      if (!redemption?.id) {
        throw new Error("Failed to create redemption request.");
      }
    });

    revalidatePath("/rewards");
    revalidatePath("/points");
    revalidatePath("/redemptions");

    return { success: true };
  } catch (error: any) {
    console.error("Reward redemption error:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}

export async function getAvailableRewards() {
  try {
    const { currentUser } = await getAuthContext();
    const { tenantId } = currentUser;

    const rewards = await prisma.reward.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, rewards };
  } catch (error: any) {
    console.error("Get available rewards error:", error);
    return { error: error?.message || "An unexpected error occurred.", rewards: [] };
  }
}

export async function getUserRedemptions() {
  try {
    const { session, currentUser } = await getAuthContext();
    const { tenantId } = currentUser;

    const redemptions = await prisma.rewardRedemption.findMany({
      where: {
        tenantId,
        userId: session.user.id,
      },
      include: {
        reward: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, redemptions };
  } catch (error: any) {
    console.error("Get user redemptions error:", error);
    return { error: error?.message || "An unexpected error occurred.", redemptions: [] };
  }
}

export async function getTenantRedemptions() {
  try {
    const { currentUser } = await getAuthContext();
    const { tenantId, role } = currentUser;

    if (role !== "OWNER" && role !== "ADMIN" && role !== "MANAGER") {
      return { error: "Insufficient permissions.", redemptions: [] };
    }

    const redemptions = await prisma.rewardRedemption.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        reward: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, redemptions };
  } catch (error: any) {
    console.error("Get tenant redemptions error:", error);
    return { error: error?.message || "An unexpected error occurred.", redemptions: [] };
  }
}

export async function approveRedemptionAction(redemptionId: string) {
  return updateRedemptionStatusAction({
    redemptionId,
    status: "APPROVED",
  });
}

export async function rejectRedemptionAction(redemptionId: string) {
  return updateRedemptionStatusAction({
    redemptionId,
    status: "REJECTED",
  });
}

export async function rejectRedemptionWithReasonAction(data: z.infer<typeof rejectRedemptionSchema>) {
  const result = rejectRedemptionSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  return updateRedemptionStatusAction({
    redemptionId: result.data.redemptionId,
    status: "REJECTED",
    rejectionReason: result.data.reason,
  });
}

async function updateRedemptionStatusAction(args: {
  redemptionId: string;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}) {
  const { redemptionId, status, rejectionReason } = args;
  if (!redemptionId) {
    return { error: "Redemption ID is required." };
  }

  try {
    const { currentUser } = await getAuthContext();
    const { tenantId, role } = currentUser;

    if (role !== "OWNER" && role !== "ADMIN" && role !== "MANAGER") {
      return { error: "Insufficient permissions." };
    }

    const redemption = await prisma.rewardRedemption.findFirst({
      where: {
        id: redemptionId,
        tenantId,
      },
      select: { id: true, status: true, userId: true, points: true },
    });

    if (!redemption) {
      return { error: "Redemption request not found." };
    }

    if (redemption.status !== "PENDING") {
      return { error: "Only pending redemption requests can be updated." };
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: redemption.userId,
          },
        },
        select: { id: true, totalPoints: true, reservedPoints: true },
      });

      if (!wallet) {
        throw new Error("Wallet not found for redemption user.");
      }

      if (wallet.reservedPoints < redemption.points) {
        throw new Error("Reserved points are lower than redemption cost.");
      }

      if (status === "APPROVED" && wallet.totalPoints < redemption.points) {
        throw new Error("Total points are lower than redemption cost.");
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data:
          status === "APPROVED"
            ? {
                reservedPoints: { decrement: redemption.points },
                totalPoints: { decrement: redemption.points },
              }
            : {
                reservedPoints: { decrement: redemption.points },
              },
      });

      await tx.rewardRedemption.update({
        where: { id: redemptionId },
        data: {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason ?? null : null,
        },
      });

      if (status === "APPROVED") {
        await tx.pointLedger.create({
          data: {
            tenantId,
            fromUserId: null,
            toUserId: redemption.userId,
            amount: -redemption.points,
            type: "REWARD",
          },
        });
      }
    });

    revalidatePath("/redemptions");
    revalidatePath("/rewards");
    revalidatePath("/points");

    return { success: true };
  } catch (error: any) {
    console.error("Update redemption status error:", error);
    return { error: error?.message || "An unexpected error occurred." };
  }
}
