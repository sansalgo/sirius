import { requirePageAccess } from "@/lib/authz";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ChallengesTable } from "@/components/challenges-table";

type SubmissionAnswer = {
  key: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "LINK";
  value: string;
};

function parseSubmissionAnswers(value: unknown): SubmissionAnswer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key : "";
      const label = typeof record.label === "string" ? record.label : key;
      const type = record.type;
      const responseValue = typeof record.value === "string" ? record.value : "";

      if (!key || !label || (type !== "TEXT" && type !== "TEXTAREA" && type !== "LINK")) {
        return null;
      }

      return {
        key,
        label,
        type,
        value: responseValue,
      } satisfies SubmissionAnswer;
    })
    .filter((entry): entry is SubmissionAnswer => Boolean(entry));
}

async function getData() {
  const { user } = await requirePageAccess("challenges.view");
  const canManageChallenges = can(user.role, "challenges.manage");
  const canReviewChallenges = can(user.role, "challenges.review");

  const [challenges, mySubmissions, pendingSubmissions] = await Promise.all([
    prisma.challenge.findMany({
      where: { tenantId: user.tenantId },
      include: {
        fields: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.challengeSubmission.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
      },
      select: {
        id: true,
        challengeId: true,
        status: true,
        submittedAt: true,
        rejectionReason: true,
      },
      orderBy: { submittedAt: "desc" },
    }),
    canReviewChallenges
      ? prisma.challengeSubmission.findMany({
          where: {
            tenantId: user.tenantId,
            status: "PENDING",
          },
          include: {
            challenge: {
              select: { id: true },
            },
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { submittedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const latestSubmissionByChallenge = new Map<string, (typeof mySubmissions)[number]>();
  for (const submission of mySubmissions) {
    if (!latestSubmissionByChallenge.has(submission.challengeId)) {
      latestSubmissionByChallenge.set(submission.challengeId, submission);
    }
  }

  const pendingSubmissionsByChallenge = new Map<
    string,
    Array<{
      id: string;
      pointsAwarded: number;
      submittedAt: string;
      user: {
        name: string;
        email: string;
      };
      answers: SubmissionAnswer[];
    }>
  >();

  for (const submission of pendingSubmissions) {
    const challengeId = submission.challenge.id;
    const current = pendingSubmissionsByChallenge.get(challengeId) ?? [];
    current.push({
      id: submission.id,
      pointsAwarded: submission.pointsAwarded,
      submittedAt: new Date(submission.submittedAt).toLocaleString(),
      user: {
        name: submission.user.name,
        email: submission.user.email,
      },
      answers: parseSubmissionAnswers(submission.formResponse),
    });
    pendingSubmissionsByChallenge.set(challengeId, current);
  }

  return {
    currentUser: user,
    canManage: canManageChallenges,
    canReview: canReviewChallenges,
    challenges: challenges.map((challenge) => {
      const latestSubmission = latestSubmissionByChallenge.get(challenge.id);

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        instructions: challenge.instructions,
        pointsAward: challenge.pointsAward,
        approvalRequired: challenge.approvalRequired,
        isActive: challenge.isActive,
        startDate: challenge.startDate ? challenge.startDate.toISOString() : null,
        endDate: challenge.endDate ? challenge.endDate.toISOString() : null,
        latestSubmission: latestSubmission
          ? {
              id: latestSubmission.id,
              status: latestSubmission.status,
              submittedAt: latestSubmission.submittedAt.toISOString(),
              rejectionReason: latestSubmission.rejectionReason,
            }
          : null,
        fields: challenge.fields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder,
          helpText: field.helpText,
          required: field.required,
        })),
        pendingSubmissions: pendingSubmissionsByChallenge.get(challenge.id) ?? [],
      };
    }),
  };
}

export default async function ChallengesPage() {
  const data = await getData();

  return (
    <div className="flex-1 p-8 pt-6">
      <ChallengesTable
        challenges={data.challenges}
        canManage={data.canManage}
        canReview={data.canReview}
        isEmployeeView={!data.canManage && !data.canReview}
        currentUserStatus={data.currentUser.status}
      />
    </div>
  );
}
