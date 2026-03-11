"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChallengeReviewActions } from "@/components/challenge-review-actions";

type SubmissionAnswer = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  value: string;
};

type ChallengeReviewQueueDialogProps = {
  challengeTitle: string;
  submissions: Array<{
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

export function ChallengeReviewQueueDialog({
  challengeTitle,
  submissions,
}: ChallengeReviewQueueDialogProps) {
  if (!submissions.length) {
    return <span className="text-muted-foreground">No pending submissions</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Review ({submissions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{challengeTitle}</DialogTitle>
          <DialogDescription>
            Review pending submissions and approve or reject them from one place.
          </DialogDescription>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">
                  <div>{submission.user.name}</div>
                  <div className="text-xs text-muted-foreground">{submission.user.email}</div>
                </TableCell>
                <TableCell>{submission.pointsAwarded}</TableCell>
                <TableCell>{submission.submittedAt}</TableCell>
                <TableCell>
                  <div className="max-w-xs space-y-1">
                    {submission.answers.slice(0, 2).map((answer) => (
                      <div key={answer.key} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{answer.label}: </span>
                        {answer.value || "-"}
                      </div>
                    ))}
                    {submission.answers.length > 2 ? (
                      <div className="text-xs text-muted-foreground">
                        +{submission.answers.length - 2} more fields
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <ChallengeReviewActions
                    submissionId={submission.id}
                    challengeTitle={challengeTitle}
                    employeeName={submission.user.name}
                    pointsAwarded={submission.pointsAwarded}
                    submittedAt={submission.submittedAt}
                    answers={submission.answers}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
