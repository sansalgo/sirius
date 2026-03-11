"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewChallengeSubmissionAction } from "@/actions/challenge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SubmissionAnswer = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  value: string;
};

type ChallengeReviewActionsProps = {
  submissionId: string;
  challengeTitle: string;
  employeeName: string;
  pointsAwarded: number;
  submittedAt: string;
  answers: SubmissionAnswer[];
};

export function ChallengeReviewActions({
  submissionId,
  challengeTitle,
  employeeName,
  pointsAwarded,
  submittedAt,
  answers,
}: ChallengeReviewActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await reviewChallengeSubmissionAction({
        submissionId,
        decision: "APPROVE",
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await reviewChallengeSubmissionAction({
        submissionId,
        decision: "REJECT",
        rejectionReason: reason.trim(),
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      setReason("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Review</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Challenge Submission</DialogTitle>
          <DialogDescription>
            Validate the submission before points are awarded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

          <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Challenge</p>
              <p className="font-medium">{challengeTitle}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Employee</p>
              <p className="font-medium">{employeeName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Points</p>
              <Badge>{pointsAwarded} points</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Submitted</p>
              <p className="font-medium">{submittedAt}</p>
            </div>
          </div>

          <div className="space-y-3">
            {answers.map((answer) => (
              <div key={answer.key} className="rounded-md border p-4">
                <p className="text-sm font-medium">{answer.label}</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  {answer.type === "LINK" && answer.value ? (
                    <a
                      href={answer.value}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-primary underline underline-offset-4"
                    >
                      {answer.value}
                    </a>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{answer.value || "-"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Reject Reason</p>
            <Input
              placeholder="Required only when rejecting"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || reason.trim().length < 3}
            onClick={handleReject}
          >
            {isPending ? "Saving..." : "Reject"}
          </Button>
          <Button disabled={isPending} onClick={handleApprove}>
            {isPending ? "Saving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
