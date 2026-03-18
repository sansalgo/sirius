import { createHmac } from "node:crypto";

import Razorpay from "razorpay";

import { prisma } from "@/lib/prisma";
import { ensureTenantOwner } from "@/lib/subscriptions";

const PRO_MONTHLY_PRICE_PAISE = 49900;
const GRACE_PERIOD_DAYS = 7;
const SUBSCRIPTION_TOTAL_COUNT = 1200;

function getOptionalEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return null;
}

export function getRazorpayMode() {
  return process.env.RAZORPAY_MODE === "live" ? "live" as const : "test" as const;
}

export function getRazorpayConfig() {
  const mode = getRazorpayMode();

  return {
    mode,
    keyId: getOptionalEnv(
      mode === "live" ? "RAZORPAY_LIVE_KEY_ID" : "RAZORPAY_TEST_KEY_ID",
      "RAZORPAY_KEY_ID",
    ),
    keySecret: getOptionalEnv(
      mode === "live" ? "RAZORPAY_LIVE_KEY_SECRET" : "RAZORPAY_TEST_KEY_SECRET",
      "RAZORPAY_KEY_SECRET",
    ),
    webhookSecret: getOptionalEnv(
      mode === "live" ? "RAZORPAY_LIVE_WEBHOOK_SECRET" : "RAZORPAY_TEST_WEBHOOK_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
    ),
    companyName: process.env.BILLING_COMPANY_NAME ?? "Sirius",
    supportEmail: process.env.BILLING_SUPPORT_EMAIL ?? "support@example.com",
    supportPhone: process.env.BILLING_SUPPORT_PHONE ?? null,
  };
}

export function isRazorpayConfigured() {
  const config = getRazorpayConfig();
  return Boolean(config.keyId && config.keySecret);
}

export function getRazorpayCheckoutConfig() {
  const config = getRazorpayConfig();

  return {
    enabled: Boolean(config.keyId),
    keyId: config.keyId,
    mode: config.mode,
    companyName: config.companyName,
    supportEmail: config.supportEmail,
    supportPhone: config.supportPhone,
    proMonthlyPricePaise: PRO_MONTHLY_PRICE_PAISE,
    gracePeriodDays: GRACE_PERIOD_DAYS,
  };
}

export function getRazorpayClient() {
  const config = getRazorpayConfig();

  if (!config.keyId || !config.keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });
}

export function getProMonthlyPricePaise() {
  return PRO_MONTHLY_PRICE_PAISE;
}

export function getGracePeriodDays() {
  return GRACE_PERIOD_DAYS;
}

export function toDateFromUnix(timestamp?: number | null) {
  return typeof timestamp === "number" ? new Date(timestamp * 1000) : null;
}

export function getGracePeriodEndDate(from = new Date()) {
  return new Date(from.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

export function mapRazorpaySubscriptionStatus(
  status: string | null | undefined,
): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "EXPIRED" {
  switch (status) {
    case "active":
    case "authenticated":
      return "ACTIVE";
    case "pending":
    case "created":
      return "TRIALING";
    case "halted":
      return "PAST_DUE";
    case "cancelled":
      return "CANCELED";
    case "completed":
    case "expired":
      return "EXPIRED";
    default:
      return "TRIALING";
  }
}

export function mapRazorpayInvoiceStatus(
  status: string | null | undefined,
): "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "VOID" {
  switch (status) {
    case "paid":
      return "PAID";
    case "issued":
    case "draft":
    case "partially_paid":
      return "PENDING";
    case "expired":
      return "FAILED";
    case "cancelled":
    case "deleted":
      return "VOID";
    default:
      return "PENDING";
  }
}

export function verifyRazorpayWebhookSignature(payload: string, signature: string) {
  const webhookSecret = getRazorpayConfig().webhookSecret;

  if (!webhookSecret) {
    throw new Error("Razorpay webhook secret is not configured.");
  }

  const expectedSignature = createHmac("sha256", webhookSecret).update(payload).digest("hex");
  return expectedSignature === signature;
}

async function findExistingRazorpayCustomerByEmail(email: string) {
  const razorpay = getRazorpayClient();
  const normalizedEmail = email.toLowerCase();
  let skip = 0;
  const count = 100;

  while (true) {
    const response = await razorpay.customers.all({ skip, count });
    const matchedCustomer = response.items.find(
      (customer) => customer.email?.toLowerCase() === normalizedEmail,
    );

    if (matchedCustomer) {
      return matchedCustomer;
    }

    if (response.items.length < count) {
      return null;
    }

    skip += count;
  }
}

export async function ensureRazorpayCustomerForTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
    },
  });
  const tenantOwner = await ensureTenantOwner(tenantId);

  if (!tenantOwner?.owner?.email) {
    throw new Error("An admin account with an email is required before starting billing.");
  }

  const latestSubscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId },
    orderBy: [{ createdAt: "desc" }],
  });

  if (latestSubscription?.providerCustomerId) {
    return latestSubscription.providerCustomerId;
  }

  const razorpay = getRazorpayClient();
  let customer;

  try {
    customer = await razorpay.customers.create({
      name: tenantOwner.owner.name,
      email: tenantOwner.owner.email,
      fail_existing: 0,
      notes: {
        tenantId: tenantId,
        tenantName: tenant?.name ?? "Unknown tenant",
      },
    });
  } catch (error) {
    const razorpayError =
      typeof error === "object" && error !== null && "error" in error
        ? (error as { error?: { code?: string; description?: string } }).error
        : null;

    const isExistingCustomerError =
      razorpayError?.code === "BAD_REQUEST_ERROR" &&
      razorpayError.description === "Customer already exists for the merchant";

    if (!isExistingCustomerError) {
      throw error;
    }

    const existingCustomer = await findExistingRazorpayCustomerByEmail(tenantOwner.owner.email);

    if (!existingCustomer) {
      throw error;
    }

    customer = existingCustomer;
  }

  if (latestSubscription) {
    await prisma.tenantSubscription.update({
      where: { id: latestSubscription.id },
      data: {
        billingProvider: "razorpay",
        providerCustomerId: customer.id,
      },
    });
  }

  return customer.id;
}

export async function ensureProMonthlyPlanForSubscription(localSubscriptionId: string) {
  const localSubscription = await prisma.tenantSubscription.findUnique({
    where: { id: localSubscriptionId },
    select: {
      id: true,
      providerPlanId: true,
    },
  });

  if (!localSubscription) {
    throw new Error("Local subscription not found.");
  }

  if (localSubscription.providerPlanId) {
    return localSubscription.providerPlanId;
  }

  const razorpay = getRazorpayClient();
  const plan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: "Sirius Pro Monthly",
      amount: PRO_MONTHLY_PRICE_PAISE,
      currency: "INR",
      description: "Monthly recurring Sirius Pro subscription",
    },
    notes: {
      app: "sirius",
      tier: "PRO",
      interval: "MONTHLY",
    },
  });
  await prisma.tenantSubscription.update({
    where: { id: localSubscriptionId },
    data: {
      providerPlanId: plan.id,
      seatLimit: null,
      billingProvider: "razorpay",
    },
  });

  return plan.id;
}

export async function createOrReusePendingProSubscription(tenantId: string) {
  const latestSubscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId },
    orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
  });

  if (latestSubscription?.plan === "PRO" && latestSubscription.status === "ACTIVE") {
    return latestSubscription;
  }

  if (latestSubscription?.plan === "PRO" && latestSubscription.status === "TRIALING") {
    return latestSubscription;
  }

  return prisma.tenantSubscription.create({
    data: {
      tenantId,
      plan: "PRO",
      status: "TRIALING",
      seatLimit: null,
      billingProvider: "razorpay",
      providerCustomerId: latestSubscription?.providerCustomerId ?? null,
    },
  });
}

export async function syncSubscriptionFromRazorpay(
  localSubscriptionId: string,
  razorpaySubscriptionId?: string | null,
) {
  const localSubscription = await prisma.tenantSubscription.findUnique({
    where: { id: localSubscriptionId },
  });

  if (!localSubscription) {
    throw new Error("Subscription not found.");
  }

  const subscriptionId = razorpaySubscriptionId ?? localSubscription.providerSubscriptionId;

  if (!subscriptionId) {
    throw new Error("No Razorpay subscription ID is linked yet.");
  }

  const razorpay = getRazorpayClient();
  const remoteSubscription = await razorpay.subscriptions.fetch(subscriptionId);
  const mappedStatus = mapRazorpaySubscriptionStatus(remoteSubscription.status);
  const isPaidOrActive = mappedStatus === "ACTIVE" || mappedStatus === "PAST_DUE";

  const updated = await prisma.tenantSubscription.update({
    where: { id: localSubscription.id },
    data: {
      billingProvider: "razorpay",
      providerCustomerId: remoteSubscription.customer_id ?? localSubscription.providerCustomerId,
      providerSubscriptionId: remoteSubscription.id,
      status: mappedStatus,
      seatLimit: null,
      currentPeriodStart: toDateFromUnix(remoteSubscription.current_start),
      currentPeriodEnd: toDateFromUnix(remoteSubscription.current_end),
      gracePeriodEndsAt: mappedStatus === "PAST_DUE" ? getGracePeriodEndDate() : null,
      lastPaymentAt: isPaidOrActive ? new Date() : localSubscription.lastPaymentAt,
      lastPaymentFailedAt: mappedStatus === "PAST_DUE" ? new Date() : null,
      canceledAt: mappedStatus === "CANCELED" || mappedStatus === "EXPIRED" ? new Date() : null,
    },
  });

  if (mappedStatus === "ACTIVE" || mappedStatus === "PAST_DUE") {
    await prisma.tenant.update({
      where: { id: localSubscription.tenantId },
      data: {
        subscriptionPlan: "PRO",
      },
    });
  }

  return updated;
}

export async function syncBillingRecordFromInvoice(args: {
  tenantId: string;
  localSubscriptionId?: string | null;
  invoice: {
    id: string;
    payment_id?: string | null;
    short_url?: string | null;
    description?: string | null;
    amount?: number | string;
    currency?: string;
    status?: string;
    billing_start?: number | null;
    billing_end?: number | null;
    issued_at?: number | null;
    paid_at?: number | null;
  };
}) {
  const amount = typeof args.invoice.amount === "string"
    ? Number(args.invoice.amount)
    : args.invoice.amount ?? PRO_MONTHLY_PRICE_PAISE;

  const existingRecord = await prisma.billingRecord.findFirst({
    where: {
      tenantId: args.tenantId,
      providerInvoiceId: args.invoice.id,
    },
  });

  const data = {
    tenantId: args.tenantId,
    subscriptionId: args.localSubscriptionId ?? null,
    billingProvider: "razorpay",
    providerInvoiceId: args.invoice.id,
    providerPaymentId: args.invoice.payment_id ?? null,
    description: args.invoice.description ?? "Sirius Pro monthly subscription",
    amountInPaise: amount,
    currency: args.invoice.currency ?? "INR",
    billingInterval: "MONTHLY" as const,
    status: mapRazorpayInvoiceStatus(args.invoice.status),
    periodStart: toDateFromUnix(args.invoice.billing_start),
    periodEnd: toDateFromUnix(args.invoice.billing_end),
    issuedAt: toDateFromUnix(args.invoice.issued_at) ?? new Date(),
    paidAt: toDateFromUnix(args.invoice.paid_at),
  };

  if (existingRecord) {
    return prisma.billingRecord.update({
      where: { id: existingRecord.id },
      data,
    });
  }

  return prisma.billingRecord.create({
    data,
  });
}

export const RAZORPAY_EVENTS = [
  "payment.captured",
  "invoice.paid",
  "subscription.activated",
  "subscription.charged",
  "subscription.halted",
  "payment.failed",
] as const;

export const RAZORPAY_BILLING_DEFAULTS = {
  proMonthlyPricePaise: PRO_MONTHLY_PRICE_PAISE,
  gracePeriodDays: GRACE_PERIOD_DAYS,
  totalCount: SUBSCRIPTION_TOTAL_COUNT,
} as const;
