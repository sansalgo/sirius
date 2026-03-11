"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pointsSettingsSchema } from "@/schemas/points-settings";

async function getAuthContext() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
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
    userId: currentUser.id,
    tenantId: currentUser.tenantId,
    role: currentUser.role,
  };
}

export async function getTenantSettings() {
  try {
    const { tenantId } = await getAuthContext();

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId },
      select: {
        managerAllocationLimit: true,
        managerAllocationFrequency: true,
        peerAllocationLimit: true,
        peerAllocationFrequency: true,
      },
    });

    return { success: true, settings };
  } catch (error: any) {
    return { error: error?.message || "Failed to load tenant settings." };
  }
}

export async function updateTenantSettings(data: z.infer<typeof pointsSettingsSchema>) {
  const result = pointsSettingsSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { tenantId, role } = await getAuthContext();

    if (role !== "ADMIN") {
      return { error: "Only ADMIN can update settings." };
    }

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        managerAllocationLimit: result.data.managerAllocationLimit,
        managerAllocationFrequency: result.data.managerAllocationFrequency,
        peerAllocationLimit: result.data.peerAllocationLimit,
        peerAllocationFrequency: result.data.peerAllocationFrequency,
      },
      create: {
        tenantId,
        managerAllocationLimit: result.data.managerAllocationLimit,
        managerAllocationFrequency: result.data.managerAllocationFrequency,
        peerAllocationLimit: result.data.peerAllocationLimit,
        peerAllocationFrequency: result.data.peerAllocationFrequency,
      },
      select: {
        managerAllocationLimit: true,
        managerAllocationFrequency: true,
        peerAllocationLimit: true,
        peerAllocationFrequency: true,
      },
    });

    return { success: true, settings: updated };
  } catch (error: any) {
    return { error: error?.message || "Failed to update tenant settings." };
  }
}
