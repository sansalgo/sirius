import { NextResponse } from "next/server";

import { getActionAuthContext } from "@/lib/authz";
import {
  createOrReusePendingProSubscription,
  ensureProMonthlyPlanForSubscription,
  ensureRazorpayCustomerForTenant,
  getRazorpayCheckoutConfig,
  getRazorpayClient,
  RAZORPAY_BILLING_DEFAULTS,
  syncSubscriptionFromRazorpay,
} from "@/lib/razorpay";

export async function POST() {
  try {
    const { user } = await getActionAuthContext("dashboard.view");

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can manage billing." }, { status: 403 });
    }

    const checkoutConfig = getRazorpayCheckoutConfig();

    if (!checkoutConfig.enabled || !checkoutConfig.keyId) {
      return NextResponse.json(
        { error: "Razorpay is not configured yet. Add the billing environment variables first." },
        { status: 500 },
      );
    }

    const localSubscription = await createOrReusePendingProSubscription(user.tenantId);

    if (localSubscription.status === "ACTIVE" && localSubscription.providerSubscriptionId) {
      const synced = await syncSubscriptionFromRazorpay(localSubscription.id);

      return NextResponse.json({
        alreadyActive: true,
        subscriptionId: synced.providerSubscriptionId,
        localSubscriptionId: synced.id,
      });
    }

    await ensureRazorpayCustomerForTenant(user.tenantId);
    const planId = await ensureProMonthlyPlanForSubscription(localSubscription.id);

    let providerSubscriptionId = localSubscription.providerSubscriptionId;

    if (!providerSubscriptionId) {
      const razorpay = getRazorpayClient();
      const remoteSubscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: RAZORPAY_BILLING_DEFAULTS.totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: {
          tenantId: user.tenantId,
          localSubscriptionId: localSubscription.id,
        },
      });

      providerSubscriptionId = remoteSubscription.id;
      await syncSubscriptionFromRazorpay(localSubscription.id, remoteSubscription.id);
    } else {
      await syncSubscriptionFromRazorpay(localSubscription.id, providerSubscriptionId);
    }

    return NextResponse.json({
      keyId: checkoutConfig.keyId,
      subscriptionId: providerSubscriptionId,
      localSubscriptionId: localSubscription.id,
      planLabel: "Sirius Pro Monthly",
      amountInPaise: checkoutConfig.proMonthlyPricePaise,
      companyName: checkoutConfig.companyName,
      supportEmail: checkoutConfig.supportEmail,
      supportPhone: checkoutConfig.supportPhone,
      mode: checkoutConfig.mode,
    });
  } catch (error) {
    console.error("Razorpay subscribe error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to start the Razorpay checkout.",
      },
      { status: 500 },
    );
  }
}
