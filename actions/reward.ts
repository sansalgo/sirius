"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { addRewardSchema, editRewardSchema } from "@/schemas/reward";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function createReward(data: z.infer<typeof addRewardSchema>) {
  const result = addRewardSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, pointsRequired, isActive } = result.data;

  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, role: true },
  });

  if (!currentUser?.tenantId) {
    return { error: "You do not belong to a valid tenant organization." };
  }

  if (currentUser.role !== "ADMIN") {
    return { error: "Insufficient permissions to manage rewards." };
  }

  if (!currentUser?.tenantId) {
    return { error: "You do not belong to a valid tenant organization." };
  }

  try {
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
  } catch (error: any) {
    console.error("Reward creation error:", error);
    return { error: "An unexpected error occurred during creation" };
  }
}

export async function updateReward(data: z.infer<typeof editRewardSchema>) {
  const result = editRewardSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { id, title, description, pointsRequired, isActive } = result.data;

  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, role: true },
  });

  if (!currentUser?.tenantId) {
    return { error: "You do not belong to a valid tenant organization." };
  }

  if (currentUser.role !== "ADMIN") {
    return { error: "Insufficient permissions to manage rewards." };
  }

  if (!currentUser?.tenantId) {
    return { error: "You do not belong to a valid tenant organization." };
  }

  const targetReward = await prisma.reward.findUnique({
    where: { id },
  });

  if (!targetReward || targetReward.tenantId !== currentUser.tenantId) {
    return { error: "Reward not found or unauthorized to edit." };
  }

  try {
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
  } catch (error: any) {
    console.error("Reward update error:", error);
    return { error: "An unexpected error occurred during update" };
  }
}
