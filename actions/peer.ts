"use server";

import { z } from "zod";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getAllocationPeriod } from "@/lib/utils";
import { sendPeerPointsSchema } from "@/schemas/peer";

export async function getPeerAllocationStatus() {
  try {
    const { user } = await getActionAuthContext("recognition.view");
    const { id: userId, tenantId } = user;

    const tenantSettings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId },
      select: {
        peerAllocationLimit: true,
        peerAllocationFrequency: true,
      },
    });

    const { periodStart, periodEnd } = getAllocationPeriod(
      tenantSettings.peerAllocationFrequency
    );

    const allocation = await prisma.peerAllocation.findUnique({
      where: {
        tenantId_userId_periodStart: {
          tenantId,
          userId,
          periodStart,
        },
      },
      select: {
        allocationLimit: true,
        usedAmount: true,
        periodStart: true,
        periodEnd: true,
      },
    });

    const allocationLimit = allocation?.allocationLimit ?? tenantSettings.peerAllocationLimit;
    const usedAmount = allocation?.usedAmount ?? 0;

    return {
      success: true,
      status: {
        allocationLimit,
        usedAmount,
        remainingAmount: Math.max(0, allocationLimit - usedAmount),
        periodStart: allocation?.periodStart ?? periodStart,
        periodEnd: allocation?.periodEnd ?? periodEnd,
      },
    };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to load peer allocation status.") };
  }
}

export async function sendPeerPointsAction(data: z.infer<typeof sendPeerPointsSchema>) {
  const result = sendPeerPointsSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { toUserId, amount } = result.data;

  try {
    const { user } = await getActionAuthContext("peer.send");
    const { id: userId, tenantId } = user;

    if (userId === toUserId) {
      return { error: "You cannot send points to yourself." };
    }

    const toUser = await prisma.user.findFirst({
      where: {
        id: toUserId,
        tenantId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!toUser) {
      return { error: "Recipient not found in your organization." };
    }

    await prisma.$transaction(async (tx) => {
      const tenantSettings = await tx.tenantSettings.upsert({
        where: { tenantId },
        update: {},
        create: { tenantId },
      });
      const { periodStart, periodEnd } = getAllocationPeriod(
        tenantSettings.peerAllocationFrequency
      );

      const peerAllocation = await tx.peerAllocation.upsert({
        where: {
          tenantId_userId_periodStart: {
            tenantId,
            userId,
            periodStart,
          },
        },
        update: {},
        create: {
          tenantId,
          userId,
          allocationLimit: tenantSettings.peerAllocationLimit,
          usedAmount: 0,
          periodStart,
          periodEnd,
        },
      });

      if (peerAllocation.usedAmount + amount > peerAllocation.allocationLimit) {
        throw new Error("Peer allocation limit exceeded for the current period.");
      }

      const sendsToSameUserInPeriod = await tx.pointLedger.count({
        where: {
          tenantId,
          fromUserId: userId,
          toUserId,
          type: "PEER",
          createdAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
      });

      if (sendsToSameUserInPeriod >= 3) {
        throw new Error("You can send peer points to the same user at most 3 times per period.");
      }

      await tx.pointLedger.create({
        data: {
          tenantId,
          fromUserId: userId,
          toUserId,
          amount,
          type: "PEER",
        },
      });

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

      await tx.peerAllocation.update({
        where: { id: peerAllocation.id },
        data: {
          usedAmount: { increment: amount },
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to send peer points.") };
  }
}
