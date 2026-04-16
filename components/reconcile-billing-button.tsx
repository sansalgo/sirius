"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReconcileBillingButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleReconcile = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/razorpay/reconcile", {
          method: "POST",
        });
        const data = (await res.json()) as {
          success?: boolean;
          invoicesSynced?: number;
          error?: string;
        };

        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.error ?? "Reconciliation failed.",
          });
          return;
        }

        const count = data.invoicesSynced ?? 0;
        setMessage({
          type: "success",
          text:
            count === 0
              ? "Already up to date."
              : `Synced ${count} invoice${count !== 1 ? "s" : ""}.`,
        });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "Unexpected error. Please try again." });
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReconcile}
        disabled={isPending}
      >
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing…" : "Sync with Razorpay"}
      </Button>
      {message && (
        <p
          className={`text-xs ${
            message.type === "success"
              ? "text-muted-foreground"
              : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
