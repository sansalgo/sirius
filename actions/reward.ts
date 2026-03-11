"use server";

import { z } from "zod";
import { addRewardSchema, editRewardSchema } from "@/schemas/reward";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function createReward(data: z.infer<typeof addRewardSchema>) {
  const result = addRewardSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, pointsRequired, isActive } = result.data;

  try {
    const { user: currentUser } = await getActionAuthContext("rewards.manage");

    await prisma.reward.create({
      data: {
        tenantId: currentUser.tenantId,
        title,
        description,
        pointsRequired,
        isActive: isActive !== false,
      },
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Reward creation error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred during creation") };
  }
}

export async function updateReward(data: z.infer<typeof editRewardSchema>) {
  const result = editRewardSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { id, title, description, pointsRequired, isActive } = result.data;

  try {
    const { user: currentUser } = await getActionAuthContext("rewards.manage");

    const targetReward = await prisma.reward.findUnique({
      where: { id },
    });

    if (!targetReward || targetReward.tenantId !== currentUser.tenantId) {
      return { error: "Reward not found or unauthorized to edit." };
    }

    await prisma.reward.update({
      where: { id },
      data: {
        title,
        description,
        pointsRequired,
        isActive,
      },
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Reward update error:", error);
    return { error: getActionErrorMessage(error, "An unexpected error occurred during update") };
  }
}
