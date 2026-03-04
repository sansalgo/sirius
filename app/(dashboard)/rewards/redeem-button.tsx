"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemRewardAction } from "@/actions/redemption";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RedeemButtonProps = {
  rewardId: string;
  disabled: boolean;
};

export function RedeemButton({ rewardId, disabled }: RedeemButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        disabled={disabled || isPending}
        onClick={() => setOpen(true)}
      >
        {isPending ? "Redeeming..." : "Redeem"}
      </Button>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Do you want to create this redemption request and deduct points now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await redeemRewardAction({ rewardId });
                  if (result?.error) {
                    setError(result.error);
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                });
              }}
            >
              {isPending ? "Redeeming..." : "Confirm Redeem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
