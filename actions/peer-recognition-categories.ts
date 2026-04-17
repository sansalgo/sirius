"use server";

import { z } from "zod";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/schemas/peer-recognition-category";

export async function listCategoriesAction() {
  try {
    const { user } = await getActionAuthContext("categories.manage");

    const categories = await prisma.peerRecognitionCategory.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        points: true,
        status: true,
        createdAt: true,
      },
    });

    return { success: true, categories };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to load categories.") };
  }
}

export async function createCategoryAction(data: z.infer<typeof createCategorySchema>) {
  const result = createCategorySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user } = await getActionAuthContext("categories.manage");

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {},
      create: { tenantId: user.tenantId },
      select: { peerAllocationLimit: true },
    });

    if (settings.peerAllocationLimit === 0) {
      return { error: "Set a peer allocation limit before creating categories." };
    }

    if (result.data.points > settings.peerAllocationLimit) {
      return {
        error: `Category points (${result.data.points}) cannot exceed the peer allocation limit (${settings.peerAllocationLimit}).`,
      };
    }

    const category = await prisma.peerRecognitionCategory.create({
      data: {
        tenantId: user.tenantId,
        name: result.data.name,
        description: result.data.description ?? null,
        points: result.data.points,
        status: result.data.status,
      },
    });

    return { success: true, category };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to create category.") };
  }
}

export async function updateCategoryAction(data: z.infer<typeof updateCategorySchema>) {
  const result = updateCategorySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user } = await getActionAuthContext("categories.manage");

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {},
      create: { tenantId: user.tenantId },
      select: { peerAllocationLimit: true },
    });

    if (settings.peerAllocationLimit === 0) {
      return { error: "Set a peer allocation limit before editing categories." };
    }

    if (result.data.points > settings.peerAllocationLimit) {
      return {
        error: `Category points (${result.data.points}) cannot exceed the peer allocation limit (${settings.peerAllocationLimit}).`,
      };
    }

    const existing = await prisma.peerRecognitionCategory.findFirst({
      where: { id: result.data.id, tenantId: user.tenantId },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Category not found." };
    }

    const category = await prisma.peerRecognitionCategory.update({
      where: { id: result.data.id },
      data: {
        name: result.data.name,
        description: result.data.description ?? null,
        points: result.data.points,
        status: result.data.status,
      },
    });

    return { success: true, category };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to update category.") };
  }
}
