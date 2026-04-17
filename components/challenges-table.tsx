"use client";

import { useMemo, useState } from "react";
import { AddChallengeModal } from "@/components/add-challenge-modal";
import { ChallengeCompleteDialog } from "@/components/challenge-complete-dialog";
import { ChallengeReviewQueueDialog } from "@/components/challenge-review-queue-dialog";
import { ChallengeRowActions } from "@/components/challenge-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

type ChallengeField = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
};

type ChallengeRow = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  pointsAward: number;
  approvalRequired: boolean;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  latestSubmission: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: string;
    rejectionReason: string | null;
  } | null;
  fields: ChallengeField[];
  pendingSubmissions: Array<{
    id: string;
    pointsAwarded: number;
    submittedAt: string;
    user: { name: string; email: string };
    answers: Array<{
      key: string;
      label: string;
      type: "TEXT" | "TEXTAREA" | "LINK";
      value: string;
    }>;
  }>;
};

type ChallengesTableProps = {
  challenges: ChallengeRow[];
  canManage: boolean;
  canReview: boolean;
  isEmployeeView: boolean;
  currentUserStatus: "ACTIVE" | "INACTIVE" | null;
};

type AvailabilityVariant = "default" | "secondary" | "outline";

function getChallengeAvailability(challenge: ChallengeRow): {
  label: string;
  variant: AvailabilityVariant;
  disabled: boolean;
} {
  const now = new Date();
  const startDate = challenge.startDate ? new Date(challenge.startDate) : null;
  const endDate = challenge.endDate ? new Date(challenge.endDate) : null;

  if (!challenge.isActive) return { label: "Inactive", variant: "outline", disabled: true };
  if (startDate && now < startDate) return { label: "Upcoming", variant: "secondary", disabled: true };
  if (endDate && now > endDate) return { label: "Closed", variant: "outline", disabled: true };
  return { label: "Open", variant: "default", disabled: false };
}

function formatWindow(challenge: ChallengeRow) {
  if (!challenge.startDate && !challenge.endDate) return "Ongoing";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const start = challenge.startDate ? fmt(challenge.startDate) : "Now";
  const end = challenge.endDate ? fmt(challenge.endDate) : "No end";
  return `${start} – ${end}`;
}

function SubmissionStatus({
  status,
  rejectionReason,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}) {
  const map = {
    PENDING: { label: "Pending review", variant: "secondary" as const },
    APPROVED: { label: "Approved", variant: "default" as const },
    REJECTED: { label: "Rejected", variant: "destructive" as const },
  };
  const { label, variant } = map[status];
  return (
    <div className="space-y-1">
      <Badge variant={variant}>{label}</Badge>
      {status === "REJECTED" && rejectionReason && (
        <p className="max-w-xs text-xs text-muted-foreground">{rejectionReason}</p>
      )}
    </div>
  );
}

export function ChallengesTable({
  challenges,
  canManage,
  canReview,
  isEmployeeView,
  currentUserStatus,
}: ChallengesTableProps) {
  const [tab, setTab] = useState<"available" | "completed">("available");

  const visibleChallenges = useMemo(() => {
    if (!isEmployeeView) return challenges;
    if (tab === "completed")
      return challenges.filter((c) => c.latestSubmission?.status === "APPROVED");
    return challenges.filter((c) => c.latestSubmission?.status !== "APPROVED");
  }, [challenges, isEmployeeView, tab]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-end">
        {canManage && <AddChallengeModal />}
      </div>

      {/* Employee tabs */}
      {isEmployeeView && (
        <Tabs defaultValue={tab}>
          <TabsList>
            <TabsTrigger value="available" onClick={() => setTab("available")}>
              Available
            </TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setTab("completed")}>
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challenge</TableHead>
              <TableHead>Points</TableHead>
              {!isEmployeeView && <TableHead>Window</TableHead>}
              <TableHead>Mode</TableHead>
              {isEmployeeView ? (
                <TableHead>Status</TableHead>
              ) : (
                <>
                  <TableHead>Status</TableHead>
                  {canReview && <TableHead>Reviews</TableHead>}
                </>
              )}
              <TableHead>{isEmployeeView ? "Action" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleChallenges.length ? (
              visibleChallenges.map((challenge) => {
                const availability = getChallengeAvailability(challenge);
                const submission = challenge.latestSubmission;
                const canAct =
                  currentUserStatus === "ACTIVE" &&
                  !availability.disabled &&
                  (!submission || submission.status === "REJECTED");

                return (
                  <TableRow key={challenge.id}>
                    {/* Challenge title + description */}
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{challenge.title}</div>
                      {challenge.description && (
                        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {challenge.description}
                        </div>
                      )}
                    </TableCell>

                    {/* Points */}
                    <TableCell className="font-mono text-sm">
                      {challenge.pointsAward}
                    </TableCell>

                    {/* Window (manager/admin only) */}
                    {!isEmployeeView && (
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatWindow(challenge)}
                      </TableCell>
                    )}

                    {/* Mode */}
                    <TableCell>
                      <Badge
                        variant={challenge.approvalRequired ? "secondary" : "outline"}
                      >
                        {challenge.approvalRequired ? "Needs approval" : "Auto-award"}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isEmployeeView ? (
                        submission ? (
                          <SubmissionStatus
                            status={submission.status}
                            rejectionReason={submission.rejectionReason}
                          />
                        ) : (
                          <Badge variant={availability.variant}>
                            {availability.label}
                          </Badge>
                        )
                      ) : (
                        <Badge variant={challenge.isActive ? "default" : "outline"}>
                          {challenge.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Reviews column (manager/admin with review permission) */}
                    {!isEmployeeView && canReview && (
                      <TableCell>
                        {challenge.pendingSubmissions.length > 0 ? (
                          <ChallengeReviewQueueDialog
                            challengeTitle={challenge.title}
                            submissions={challenge.pendingSubmissions}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}

                    {/* Action */}
                    <TableCell>
                      {isEmployeeView ? (
                        canAct ? (
                          <ChallengeCompleteDialog
                            challenge={{
                              id: challenge.id,
                              title: challenge.title,
                              approvalRequired: challenge.approvalRequired,
                              fields: challenge.fields,
                            }}
                            buttonLabel={
                              submission?.status === "REJECTED" ? "Resubmit" : "Complete"
                            }
                          />
                        ) : null
                      ) : (
                        <ChallengeRowActions
                          challenge={challenge}
                          canManage={canManage}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isEmployeeView ? 5 : canReview ? 7 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isEmployeeView && tab === "completed"
                    ? "No completed challenges yet."
                    : "No challenges found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
