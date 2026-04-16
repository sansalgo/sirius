"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteChallengeAction } from "@/actions/challenge";
import { AddChallengeModal } from "@/components/add-challenge-modal";
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

type SubmissionAnswer = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  value: string;
};

type ChallengeRowActionsProps = {
  challenge: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    pointsAward: number;
    approvalRequired: boolean;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    fields: Array<{
      key: string;
      label: string;
      type: "TEXT" | "TEXTAREA" | "LINK";
      placeholder: string | null;
      helpText: string | null;
      required: boolean;
    }>;
    pendingSubmissions: Array<{
      id: string;
      pointsAwarded: number;
      submittedAt: string;
      user: {
        name: string;
        email: string;
      };
      answers: SubmissionAnswer[];
    }>;
  };
  canManage: boolean;
};

export function ChallengeRowActions({
  challenge,
  canManage,
}: ChallengeRowActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage ? (
        <AddChallengeModal
          challenge={{
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            instructions: challenge.instructions,
            pointsAward: challenge.pointsAward,
            approvalRequired: challenge.approvalRequired,
            isActive: challenge.isActive,
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            fields: challenge.fields,
          }}
          trigger={
            <Button size="sm" variant="outline">
              Edit
            </Button>
          }
        />
      ) : null}

      {canManage ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive">
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Challenge</DialogTitle>
              <DialogDescription>
                Delete &quot;{challenge.title}&quot;. Challenges with submissions cannot be deleted.
              </DialogDescription>
            </DialogHeader>
            {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await deleteChallengeAction({ challengeId: challenge.id });
                    if (result?.error) {
                      setError(result.error);
                      return;
                    }

                    setDeleteOpen(false);
                    router.refresh();
                  });
                }}
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
