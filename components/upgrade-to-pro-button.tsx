"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type UpgradeToProButtonProps = {
  isConfigured: boolean;
  mode: "test" | "live";
  companyName: string;
  billingEmail: string;
};

async function loadRazorpayScript() {
  if (window.Razorpay) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function UpgradeToProButton({
  isConfigured,
  mode,
  companyName,
  billingEmail,
}: UpgradeToProButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleUpgrade = () => {
    startTransition(async () => {
      setMessage(null);

      if (!isConfigured) {
        setMessage("Razorpay environment variables are not configured yet.");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        setMessage("Unable to load Razorpay Checkout. Please try again.");
        return;
      }

      const subscribeResponse = await fetch("/api/billing/razorpay/subscribe", {
        method: "POST",
      });

      const subscribePayload = await subscribeResponse.json();

      if (!subscribeResponse.ok) {
        setMessage(subscribePayload.error ?? "Unable to start the upgrade checkout.");
        return;
      }

      if (subscribePayload.alreadyActive) {
        router.refresh();
        return;
      }

      const checkout = new window.Razorpay({
        key: subscribePayload.keyId,
        subscription_id: subscribePayload.subscriptionId,
        name: subscribePayload.companyName ?? companyName,
        description: subscribePayload.planLabel ?? "Sirius Pro Monthly",
        image: undefined,
        modal: {
          ondismiss: () => {
            setMessage("Checkout was closed before authorization completed.");
          },
        },
        prefill: {
          email: billingEmail,
        },
        theme: {
          color: "#111827",
        },
        handler: async (response: Record<string, string>) => {
          const syncResponse = await fetch("/api/billing/razorpay/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              localSubscriptionId: subscribePayload.localSubscriptionId,
              razorpaySubscriptionId:
                response.razorpay_subscription_id ?? subscribePayload.subscriptionId,
            }),
          });

          const syncPayload = await syncResponse.json();

          if (!syncResponse.ok) {
            setMessage(syncPayload.error ?? "Payment succeeded, but sync is still pending.");
            router.refresh();
            return;
          }

          setMessage("Subscription authorized. Syncing the latest billing state now.");
          router.refresh();
        },
      });

      checkout.open();
    });
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleUpgrade} disabled={isPending || !isConfigured}>
        {isPending ? "Starting Checkout..." : "Upgrade to Pro"}
      </Button>
      <div className="text-xs text-muted-foreground">
        {mode === "test"
          ? "Razorpay test mode is enabled."
          : "Razorpay live mode is enabled."}
      </div>
      {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
    </div>
  );
}
