import { prisma } from "@/lib/prisma";

export const PLAN_CONFIG = {
  FREE: {
    label: "Free",
    seatLimit: 10,
    description: "For smaller teams getting started with recognition and rewards.",
  },
  PRO: {
    label: "Pro",
    seatLimit: null,
    description: "Unlimited seats with room for paid billing and future payment automation.",
  },
} as const;

export type SubscriptionPlanKey = keyof typeof PLAN_CONFIG;

export function getPlanSeatLimit(plan: SubscriptionPlanKey) {
  return PLAN_CONFIG[plan].seatLimit;
}

export function isPlanKey(value: string | null | undefined): value is SubscriptionPlanKey {
  return value === "FREE" || value === "PRO";
}

export async function ensureTenantOwner(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      ownerUserId: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!tenant) {
    return null;
  }

  if (tenant.ownerUserId && tenant.owner) {
    return {
      ownerUserId: tenant.ownerUserId,
      owner: tenant.owner,
    };
  }

  const fallbackAdmin = await prisma.user.findFirst({
    where: {
      tenantId,
      role: "ADMIN",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!fallbackAdmin) {
    return {
      ownerUserId: null,
      owner: null,
    };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ownerUserId: fallbackAdmin.id,
    },
  });

  return {
    ownerUserId: fallbackAdmin.id,
    owner: fallbackAdmin,
  };
}


export async function getCurrentTenantSubscription(tenantId: string) {
  return prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      status: {
        in: ["ACTIVE", "PAST_DUE"],
      },
    },
    orderBy: [
      { createdAt: "desc" },
      { updatedAt: "desc" },
    ],
  });
}

export async function getLatestTenantSubscription(tenantId: string) {
  return prisma.tenantSubscription.findFirst({
    where: { tenantId },
    orderBy: [
      { createdAt: "desc" },
      { updatedAt: "desc" },
    ],
  });
}

export async function downgradeTenantToFreeIfExpired(tenantId: string) {
  const latestSubscription = await getLatestTenantSubscription(tenantId);

  if (
    !latestSubscription ||
    latestSubscription.plan !== "PRO" ||
    latestSubscription.status !== "PAST_DUE" ||
    !latestSubscription.gracePeriodEndsAt ||
    latestSubscription.gracePeriodEndsAt > new Date()
  ) {
    return latestSubscription;
  }

  const freeSeatLimit = getPlanSeatLimit("FREE");

  await prisma.$transaction([
    prisma.tenantSubscription.update({
      where: { id: latestSubscription.id },
      data: {
        plan: "FREE",
        status: "EXPIRED",
        seatLimit: freeSeatLimit,
        gracePeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
      },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionPlan: "FREE",
      },
    }),
  ]);

  return null;
}

export async function getEffectiveTenantPlan(tenantId: string) {
  await downgradeTenantToFreeIfExpired(tenantId);

  const [subscription, tenant] = await Promise.all([
    getCurrentTenantSubscription(tenantId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    }),
  ]);
  const plan = isPlanKey(subscription?.plan)
    ? subscription.plan
    : isPlanKey(tenant?.subscriptionPlan)
      ? tenant.subscriptionPlan
      : "FREE";

  return {
    subscription,
    plan,
    config: PLAN_CONFIG[plan],
  };
}

export async function getTenantSeatUsage(tenantId: string) {
  const tenantOwner = await ensureTenantOwner(tenantId);

  const usedSeats = await prisma.user.count({
    where: {
      tenantId,
      ...(tenantOwner?.ownerUserId
        ? {
            NOT: {
              id: tenantOwner.ownerUserId,
            },
          }
        : {}),
    },
  });

  return {
    ownerUserId: tenantOwner?.ownerUserId ?? null,
    usedSeats,
  };
}

export async function getTenantSeatSummary(tenantId: string) {
  const [{ plan, config, subscription }, { ownerUserId, usedSeats }] = await Promise.all([
    getEffectiveTenantPlan(tenantId),
    getTenantSeatUsage(tenantId),
  ]);

  return {
    plan,
    subscription,
    ownerUserId,
    usedSeats,
    seatLimit: config.seatLimit,
    seatsRemaining: config.seatLimit === null ? null : Math.max(config.seatLimit - usedSeats, 0),
    isAtLimit: config.seatLimit === null ? false : usedSeats >= config.seatLimit,
  };
}

// ---------------------------------------------------------------------------
// Subscription banner state — used by the dashboard layout
// ---------------------------------------------------------------------------

export type SubscriptionBannerState =
  | { type: "none" }
  | { type: "grace_period"; gracePeriodEndsAt: Date; daysLeft: number }
  | { type: "expired_over_quota"; usedSeats: number; seatLimit: number; overBy: number }
  | { type: "expired" };

export async function getSubscriptionBannerState(tenantId: string): Promise<SubscriptionBannerState> {
  const [{ plan, subscription }, { usedSeats }] = await Promise.all([
    getEffectiveTenantPlan(tenantId),
    getTenantSeatUsage(tenantId),
  ]);

  // Active PRO subscription — nothing to show
  if (subscription?.status === "ACTIVE" && plan === "PRO") {
    return { type: "none" };
  }

  // Still within the grace period after a payment failure
  if (subscription?.status === "PAST_DUE" && subscription.gracePeriodEndsAt) {
    const gracePeriodEndsAt = subscription.gracePeriodEndsAt;
    if (gracePeriodEndsAt > new Date()) {
      const daysLeft = Math.max(
        1,
        Math.ceil((gracePeriodEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );
      return { type: "grace_period", gracePeriodEndsAt, daysLeft };
    }
  }

  // Subscription has expired — check if they're over the free quota
  if (plan === "FREE") {
    const freeSeatLimit = getPlanSeatLimit("FREE") ?? 10;
    if (usedSeats > freeSeatLimit) {
      return {
        type: "expired_over_quota",
        usedSeats,
        seatLimit: freeSeatLimit,
        overBy: usedSeats - freeSeatLimit,
      };
    }
  }

  return { type: "none" };
}

// ---------------------------------------------------------------------------

export function formatCurrencyFromPaise(amountInPaise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}
