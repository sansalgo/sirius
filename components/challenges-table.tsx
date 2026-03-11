"use client";

import { useMemo, useState } from "react";
import { AddChallengeModal } from "@/components/add-challenge-modal";
import { ChallengeCompleteDialog } from "@/components/challenge-complete-dialog";
import { ChallengeRowActions } from "@/components/challenge-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    user: {
      name: string;
      email: string;
    };
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

function getStatusVariant(status: "PENDING" | "APPROVED" | "REJECTED") {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function getChallengeAvailability(challenge: ChallengeRow) {
  const now = new Date();
  const startDate = challenge.startDate ? new Date(challenge.startDate) : null;
  const endDate = challenge.endDate ? new Date(challenge.endDate) : null;

  if (!challenge.isActive) {
    return { label: "Inactive", disabled: true };
  }
  if (startDate && now < startDate) {
    return { label: "Upcoming", disabled: true };
  }
  if (endDate && now > endDate) {
    return { label: "Closed", disabled: true };
  }

  return { label: "Open", disabled: false };
}

function formatWindow(challenge: ChallengeRow) {
  const start = challenge.startDate ? new Date(challenge.startDate).toLocaleDateString() : "Now";
  const end = challenge.endDate ? new Date(challenge.endDate).toLocaleDateString() : "No end";
  return `${start} - ${end}`;
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
    if (!isEmployeeView) {
      return challenges;
    }

    if (tab === "completed") {
      return challenges.filter((challenge) => challenge.latestSubmission?.status === "APPROVED");
    }

    return challenges.filter((challenge) => challenge.latestSubmission?.status !== "APPROVED");
  }, [challenges, isEmployeeView, tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Challenges</h2>
          <p className="text-muted-foreground">
            {isEmployeeView
              ? "Complete challenges and track the ones you have already finished."
              : "Manage challenge definitions and review incoming submissions."}
          </p>
        </div>
        {canManage ? <AddChallengeModal /> : null}
      </div>

      {isEmployeeView ? (
        <div className="flex items-center gap-2">
          <Button
            variant={tab === "available" ? "default" : "outline"}
            onClick={() => setTab("available")}
          >
            Available
          </Button>
          <Button
            variant={tab === "completed" ? "default" : "outline"}
            onClick={() => setTab("completed")}
          >
            Completed
          </Button>
        </div>
      ) : null}

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{isEmployeeView ? "Action" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleChallenges.length ? (
              visibleChallenges.map((challenge) => {
                const availability = getChallengeAvailability(challenge);
                const hasSubmitted =
                  challenge.latestSubmission?.status === "PENDING" ||
                  challenge.latestSubmission?.status === "APPROVED";
                const disabled =
                  currentUserStatus !== "ACTIVE" || availability.disabled || hasSubmitted;

                return (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">
                      <div>{challenge.title}</div>
                      <div className="max-w-md text-xs text-muted-foreground">
                        {challenge.description || "No description provided."}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{challenge.fields.length} fields</Badge>
                        {challenge.pendingSubmissions.length > 0 && !isEmployeeView ? (
                          <Badge variant="secondary">
                            {challenge.pendingSubmissions.length} pending
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={challenge.approvalRequired ? "secondary" : "default"}>
                        {challenge.approvalRequired ? "Approval required" : "Auto award"}
                      </Badge>
                    </TableCell>
                    <TableCell>{challenge.pointsAward}</TableCell>
                    <TableCell>{formatWindow(challenge)}</TableCell>
                    <TableCell>
                      {isEmployeeView ? (
                        challenge.latestSubmission ? (
                          <>
                            <Badge variant={getStatusVariant(challenge.latestSubmission.status)}>
                              {challenge.latestSubmission.status}
                            </Badge>
                            {challenge.latestSubmission.status === "REJECTED" &&
                            challenge.latestSubmission.rejectionReason ? (
                              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                {challenge.latestSubmission.rejectionReason}
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <Badge variant={availability.disabled ? "outline" : "default"}>
                            {availability.label}
                          </Badge>
                        )
                      ) : (
                        <Badge variant={challenge.isActive ? "default" : "outline"}>
                          {challenge.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEmployeeView ? (
                        <ChallengeCompleteDialog
                          challenge={{
                            id: challenge.id,
                            title: challenge.title,
                            approvalRequired: challenge.approvalRequired,
                            fields: challenge.fields,
                          }}
                          disabled={tab === "completed" || disabled}
                          buttonLabel={
                            challenge.latestSubmission?.status === "PENDING"
                              ? "Pending"
                              : challenge.latestSubmission?.status === "APPROVED"
                                ? "Completed"
                                : challenge.latestSubmission?.status === "REJECTED"
                                  ? "Resubmit"
                                  : "Complete"
                          }
                        />
                      ) : (
                        <ChallengeRowActions
                          challenge={challenge}
                          canManage={canManage}
                          canReview={canReview}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
