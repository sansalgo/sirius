"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleResend = () => {
    startTransition(async () => {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });
      setSent(true);
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      <Mail className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        {sent
          ? "Verification email sent! Check your inbox."
          : `Please verify your email address (${email}) to unlock all features.`}
      </p>
      {!sent && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={isPending}
          className="shrink-0 border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200"
        >
          {isPending ? "Sending…" : "Resend"}
        </Button>
      )}
    </div>
  );
}
