"use server";

import { prisma } from "@/lib/prisma";
import { getActionAuthContext } from "@/lib/authz";

export async function getOnboardingState(tenantId: string) {
  const [settings, employeeCount, rewardCount, tenant] = await Promise.all([
    prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { managerAllocationLimit: true, peerAllocationLimit: true },
    }),
    prisma.user.count({ where: { tenantId } }),
    prisma.reward.count({ where: { tenantId } }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { onboardingCompletedAt: true },
    }),
  ]);

  return {
    dismissed: !!tenant?.onboardingCompletedAt,
    steps: {
      settingsConfigured:
        (settings?.managerAllocationLimit ?? 0) > 0 ||
        (settings?.peerAllocationLimit ?? 0) > 0,
      // > 1 because the owner is always there
      teamInvited: employeeCount > 1,
      rewardCreated: rewardCount > 0,
    },
  };
}

export async function dismissOnboarding() {
  try {
    const { user } = await getActionAuthContext();

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { onboardingCompletedAt: new Date() },
    });

    return { success: true };
  } catch {
    return { error: "Failed to dismiss onboarding." };
  }
}
