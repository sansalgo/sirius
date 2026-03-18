import { NextRequest, NextResponse } from "next/server";

import { getActionAuthContext } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { syncSubscriptionFromRazorpay } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getActionAuthContext("dashboard.view");

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can manage billing." }, { status: 403 });
    }

    const body = (await request.json()) as {
      localSubscriptionId?: string;
      razorpaySubscriptionId?: string;
    };

    if (!body.localSubscriptionId) {
      return NextResponse.json({ error: "Missing local subscription ID." }, { status: 400 });
    }

    const localSubscription = await prisma.tenantSubscription.findUnique({
      where: { id: body.localSubscriptionId },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!localSubscription || localSubscription.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    const synced = await syncSubscriptionFromRazorpay(
      localSubscription.id,
      body.razorpaySubscriptionId,
    );

    return NextResponse.json({
      success: true,
      status: synced.status,
      plan: synced.plan,
    });
  } catch (error) {
    console.error("Razorpay sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to sync subscription state.",
      },
      { status: 500 },
    );
  }
}
