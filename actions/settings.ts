"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { pointsSettingsSchema } from "@/schemas/points-settings";

export async function getTenantSettings() {
  try {
    const { user } = await getActionAuthContext("settings.view");

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {},
      create: { tenantId: user.tenantId },
      select: {
        managerAllocationLimit: true,
        managerAllocationFrequency: true,
        peerAllocationLimit: true,
        peerAllocationFrequency: true,
      },
    });

    return { success: true, settings };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to load tenant settings.") };
  }
}

export async function updateTenantSettings(data: z.infer<typeof pointsSettingsSchema>) {
  const result = pointsSettingsSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user } = await getActionAuthContext("settings.manage");

    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId: user.tenantId },
      update: {
        managerAllocationLimit: result.data.managerAllocationLimit,
        managerAllocationFrequency: result.data.managerAllocationFrequency,
        peerAllocationLimit: result.data.peerAllocationLimit,
        peerAllocationFrequency: result.data.peerAllocationFrequency,
      },
      create: {
        tenantId: user.tenantId,
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
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "Failed to update tenant settings.") };
  }
}
