"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveRedemptionAction,
  rejectRedemptionWithReasonAction,
} from "@/actions/redemption";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type RedemptionActionsProps = {
  redemptionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  canReview: boolean;
};

export function RedemptionActions({ redemptionId, status, canReview }: RedemptionActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!canReview || status !== "PENDING") {
    return <span className="text-muted-foreground">Reviewed</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={isPending} onClick={() => setApproveOpen(true)}>
        Approve
      </Button>
      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setRejectOpen(true)}>
        Reject
      </Button>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this redemption request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await approveRedemptionAction(redemptionId);
                  if (result?.error) {
                    setError(result.error);
                    return;
                  }
                  setApproveOpen(false);
                  router.refresh();
                });
              }}
            >
              {isPending ? "Saving..." : "Confirm Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Redemption</DialogTitle>
            <DialogDescription>
              Enter a rejection reason before rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || reason.trim().length < 3}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await rejectRedemptionWithReasonAction({
                    redemptionId,
                    reason: reason.trim(),
                  });
                  if (result?.error) {
                    setError(result.error);
                    return;
                  }
                  setRejectOpen(false);
                  setReason("");
                  router.refresh();
                });
              }}
            >
              {isPending ? "Saving..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
