import { NextResponse } from "next/server";

import { getActionAuthContext } from "@/lib/authz";
import {
  getRazorpayClient,
  syncBillingRecordFromInvoice,
  syncSubscriptionFromRazorpay,
} from "@/lib/razorpay";
import { getLatestTenantSubscription } from "@/lib/subscriptions";

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

type RazorpayInvoiceItem = Record<string, unknown>;

function normalizeInvoice(item: RazorpayInvoiceItem) {
  const id = getString(item.id);
  if (!id) return null;

  return {
    id,
    payment_id: getString(item.payment_id),
    short_url: getString(item.short_url),
    description: getString(item.description),
    amount:
      typeof item.amount === "number" || typeof item.amount === "string"
        ? item.amount
        : undefined,
    currency: getString(item.currency) ?? undefined,
    status: getString(item.status) ?? undefined,
    billing_start: getNumber(item.billing_start),
    billing_end: getNumber(item.billing_end),
    issued_at: getNumber(item.issued_at),
    paid_at: getNumber(item.paid_at),
  };
}

export async function POST() {
  try {
    const { user } = await getActionAuthContext("dashboard.view");

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can reconcile billing." },
        { status: 403 }
      );
    }

    const subscription = await getLatestTenantSubscription(user.tenantId);

    if (!subscription?.providerSubscriptionId) {
      return NextResponse.json(
        { error: "No active Razorpay subscription found for this workspace." },
        { status: 404 }
      );
    }

    // Re-sync subscription state (status, period dates, customer ID)
    await syncSubscriptionFromRazorpay(
      subscription.id,
      subscription.providerSubscriptionId
    );

    // Fetch all invoices for this subscription from Razorpay
    const razorpay = getRazorpayClient();
    const invoiceResponse = (await razorpay.invoices.all({
      subscription_id: subscription.providerSubscriptionId,
      count: 100,
    }) as unknown) as { items?: RazorpayInvoiceItem[] };

    const items: RazorpayInvoiceItem[] = invoiceResponse?.items ?? [];
    let invoicesSynced = 0;

    for (const item of items) {
      const normalized = normalizeInvoice(item);
      if (!normalized) continue;

      await syncBillingRecordFromInvoice({
        tenantId: subscription.tenantId,
        localSubscriptionId: subscription.id,
        invoice: normalized,
      });
      invoicesSynced++;
    }

    return NextResponse.json({ success: true, invoicesSynced });
  } catch (error) {
    console.error("Razorpay reconcile error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reconcile billing state.",
      },
      { status: 500 }
    );
  }
}
