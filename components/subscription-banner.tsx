import Link from "next/link";
import { AlertTriangle, XCircle } from "lucide-react";
import type { SubscriptionBannerState } from "@/lib/subscriptions";

export function SubscriptionBanner({ state }: { state: SubscriptionBannerState }) {
  if (state.type === "none") return null;

  if (state.type === "grace_period") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="flex-1">
          Your subscription payment failed.{" "}
          <strong>{state.daysLeft} day{state.daysLeft !== 1 ? "s" : ""}</strong> left in your grace
          period before the account reverts to the Free plan.{" "}
          <Link href="/billing" className="font-semibold underline underline-offset-2">
            Renew now
          </Link>
        </p>
      </div>
    );
  }

  if (state.type === "expired_over_quota") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <XCircle className="h-4 w-4 shrink-0" />
        <p className="flex-1">
          Your Pro subscription has expired. Your workspace has{" "}
          <strong>
            {state.usedSeats} seats
          </strong>{" "}
          but the Free plan allows only <strong>{state.seatLimit}</strong>. Adding new members is
          paused.{" "}
          <Link href="/billing" className="font-semibold underline underline-offset-2">
            Upgrade to Pro
          </Link>{" "}
          or remove {state.overBy} member{state.overBy !== 1 ? "s" : ""} to continue.
        </p>
      </div>
    );
  }

  if (state.type === "expired") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <XCircle className="h-4 w-4 shrink-0" />
        <p className="flex-1">
          Your Pro subscription has expired and your workspace is now on the Free plan.{" "}
          <Link href="/billing" className="font-semibold underline underline-offset-2">
            Upgrade to Pro
          </Link>{" "}
          to restore unlimited seats.
        </p>
      </div>
    );
  }

  return null;
}
