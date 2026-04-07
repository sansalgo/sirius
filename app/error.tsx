"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center font-sans">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          An unexpected error occurred. Please try again.
        </p>
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </body>
    </html>
  );
}
