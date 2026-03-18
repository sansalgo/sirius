import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getGracePeriodEndDate,
  mapRazorpaySubscriptionStatus,
  syncBillingRecordFromInvoice,
  syncSubscriptionFromRazorpay,
  toDateFromUnix,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: Record<string, { entity?: Record<string, unknown> }>;
  subscription?: {
    entity?: Record<string, unknown>;
  };
};

type RazorpayEntity = Record<string, unknown>;

function getNestedEntity(payload: RazorpayWebhookPayload, key: string) {
  const entity = payload.payload?.[key]?.entity;
  return entity && typeof entity === "object" ? entity : null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function normalizeInvoiceEntity(invoiceEntity: RazorpayEntity) {
  const id = getString(invoiceEntity.id);

  if (!id) {
    return null;
  }

  return {
    id,
    payment_id: getString(invoiceEntity.payment_id),
    short_url: getString(invoiceEntity.short_url),
    description: getString(invoiceEntity.description),
    amount:
      typeof invoiceEntity.amount === "number" || typeof invoiceEntity.amount === "string"
        ? invoiceEntity.amount
        : undefined,
    currency: getString(invoiceEntity.currency) ?? undefined,
    status: getString(invoiceEntity.status) ?? undefined,
    billing_start: getNumber(invoiceEntity.billing_start),
    billing_end: getNumber(invoiceEntity.billing_end),
    issued_at: getNumber(invoiceEntity.issued_at),
    paid_at: getNumber(invoiceEntity.paid_at),
  };
}

async function findLocalSubscription(payload: RazorpayWebhookPayload) {
  const subscriptionEntity = getNestedEntity(payload, "subscription");
  const invoiceEntity = getNestedEntity(payload, "invoice");

  const providerSubscriptionId =
    getString(subscriptionEntity?.id) ??
    getString(invoiceEntity?.subscription_id) ??
    getString(payload.subscription?.entity?.id) ??
    null;

  if (providerSubscriptionId) {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: { providerSubscriptionId },
      orderBy: [{ createdAt: "desc" }],
    });

    if (subscription) {
      return subscription;
    }
  }

  const localSubscriptionId =
    typeof subscriptionEntity?.notes === "object" &&
    subscriptionEntity.notes &&
    typeof (subscriptionEntity.notes as Record<string, unknown>).localSubscriptionId === "string"
      ? (subscriptionEntity.notes as Record<string, string>).localSubscriptionId
      : typeof invoiceEntity?.notes === "object" &&
          invoiceEntity.notes &&
          typeof (invoiceEntity.notes as Record<string, unknown>).localSubscriptionId === "string"
        ? (invoiceEntity.notes as Record<string, string>).localSubscriptionId
        : null;

  if (!localSubscriptionId) {
    return null;
  }

  return prisma.tenantSubscription.findUnique({
    where: { id: localSubscriptionId },
  });
}

async function handleSubscriptionActivated(localSubscriptionId: string, providerSubscriptionId?: string) {
  const synced = await syncSubscriptionFromRazorpay(localSubscriptionId, providerSubscriptionId);

  await prisma.tenantSubscription.update({
    where: { id: synced.id },
    data: {
      status: "ACTIVE",
      gracePeriodEndsAt: null,
      lastPaymentAt: new Date(),
      lastPaymentFailedAt: null,
    },
  });
}

async function handleSubscriptionHalted(localSubscriptionId: string) {
  const now = new Date();

  await prisma.tenantSubscription.update({
    where: { id: localSubscriptionId },
    data: {
      status: "PAST_DUE",
      gracePeriodEndsAt: getGracePeriodEndDate(now),
      lastPaymentFailedAt: now,
    },
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawPayload = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing Razorpay signature." }, { status: 400 });
  }

  try {
    const isValid = verifyRazorpayWebhookSignature(rawPayload, signature);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawPayload) as RazorpayWebhookPayload;
    const event = payload.event;
    const localSubscription = await findLocalSubscription(payload);

    if (!event || !localSubscription) {
      return NextResponse.json({ received: true });
    }

    const subscriptionEntity = getNestedEntity(payload, "subscription");
    const invoiceEntity = getNestedEntity(payload, "invoice");
    const paymentEntity = getNestedEntity(payload, "payment");

    if (getString(subscriptionEntity?.id)) {
      await prisma.tenantSubscription.update({
        where: { id: localSubscription.id },
        data: {
          providerSubscriptionId: getString(subscriptionEntity?.id),
          providerCustomerId:
            getString(subscriptionEntity?.customer_id) ?? localSubscription.providerCustomerId,
          status: mapRazorpaySubscriptionStatus(getString(subscriptionEntity?.status)),
          currentPeriodStart: toDateFromUnix(getNumber(subscriptionEntity?.current_start)),
          currentPeriodEnd: toDateFromUnix(getNumber(subscriptionEntity?.current_end)),
        },
      });
    }

    const normalizedInvoice = invoiceEntity ? normalizeInvoiceEntity(invoiceEntity) : null;

    switch (event) {
      case "subscription.activated":
        await handleSubscriptionActivated(
          localSubscription.id,
          getString(subscriptionEntity?.id) ?? localSubscription.providerSubscriptionId ?? undefined,
        );
        break;
      case "subscription.charged":
        await handleSubscriptionActivated(
          localSubscription.id,
          getString(subscriptionEntity?.id) ?? localSubscription.providerSubscriptionId ?? undefined,
        );
        if (normalizedInvoice) {
          await syncBillingRecordFromInvoice({
            tenantId: localSubscription.tenantId,
            localSubscriptionId: localSubscription.id,
            invoice: normalizedInvoice,
          });
        }
        break;
      case "invoice.paid":
        await prisma.tenantSubscription.update({
          where: { id: localSubscription.id },
          data: {
            status: "ACTIVE",
            gracePeriodEndsAt: null,
            lastPaymentAt: toDateFromUnix(getNumber(invoiceEntity?.paid_at)) ?? new Date(),
            lastPaymentFailedAt: null,
          },
        });
        if (normalizedInvoice) {
          await syncBillingRecordFromInvoice({
            tenantId: localSubscription.tenantId,
            localSubscriptionId: localSubscription.id,
            invoice: normalizedInvoice,
          });
        }
        break;
      case "payment.captured":
        if (normalizedInvoice) {
          await syncBillingRecordFromInvoice({
            tenantId: localSubscription.tenantId,
            localSubscriptionId: localSubscription.id,
            invoice: {
              ...normalizedInvoice,
              payment_id: getString(paymentEntity?.id) ?? normalizedInvoice.payment_id ?? null,
            },
          });
        }
        await prisma.tenantSubscription.update({
          where: { id: localSubscription.id },
          data: {
            status: "ACTIVE",
            gracePeriodEndsAt: null,
            lastPaymentAt: toDateFromUnix(getNumber(paymentEntity?.created_at)) ?? new Date(),
            lastPaymentFailedAt: null,
          },
        });
        break;
      case "payment.failed":
      case "subscription.halted":
        await handleSubscriptionHalted(localSubscription.id);
        if (normalizedInvoice) {
          await syncBillingRecordFromInvoice({
            tenantId: localSubscription.tenantId,
            localSubscriptionId: localSubscription.id,
            invoice: normalizedInvoice,
          });
        }
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 500 },
    );
  }
}
