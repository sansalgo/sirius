"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActionAuthContext, getActionErrorMessage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import {
  createChallengeSchema,
  deleteChallengeSchema,
  reviewChallengeSchema,
  submitChallengeSchema,
  updateChallengeSchema,
} from "@/schemas/challenge";

function normalizeDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid challenge date.");
  }

  return parsed;
}

function assertManagePermission(role: string | null | undefined) {
  if (!can(role, "challenges.manage")) {
    throw new Error("Only ADMIN can manage challenges.");
  }
}

function assertReviewPermission(role: string | null | undefined) {
  if (!can(role, "challenges.review")) {
    throw new Error("Only ADMIN and MANAGER can review challenge submissions.");
  }
}

export async function createChallengeAction(data: z.infer<typeof createChallengeSchema>) {
  const result = createChallengeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user: currentUser } = await getActionAuthContext("challenges.manage");
    assertManagePermission(currentUser.role);

    const startDate = normalizeDate(result.data.startDate);
    const endDate = normalizeDate(result.data.endDate);

    await prisma.challenge.create({
      data: {
        tenantId: currentUser.tenantId!,
        title: result.data.title,
        description: result.data.description || null,
        instructions: result.data.instructions || null,
        pointsAward: result.data.pointsAward,
        approvalRequired: result.data.approvalRequired,
        isActive: result.data.isActive,
        startDate,
        endDate,
        createdById: currentUser.id,
        fields: {
          create: result.data.fields.map((field, index) => ({
            key: field.key,
            label: field.label,
            type: field.type,
            placeholder: field.placeholder || null,
            helpText: field.helpText || null,
            required: field.required,
            sortOrder: index,
          })),
        },
      },
    });

    revalidatePath("/challenges");
    return { success: true };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}

export async function updateChallengeAction(data: z.infer<typeof updateChallengeSchema>) {
  const result = updateChallengeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user: currentUser } = await getActionAuthContext("challenges.manage");
    assertManagePermission(currentUser.role);

    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        id: result.data.id,
        tenantId: currentUser.tenantId!,
      },
      select: { id: true },
    });

    if (!existingChallenge) {
      return { error: "Challenge not found." };
    }

    const startDate = normalizeDate(result.data.startDate);
    const endDate = normalizeDate(result.data.endDate);

    await prisma.$transaction(async (tx) => {
      await tx.challenge.update({
        where: { id: existingChallenge.id },
        data: {
          title: result.data.title,
          description: result.data.description || null,
          instructions: result.data.instructions || null,
          pointsAward: result.data.pointsAward,
          approvalRequired: result.data.approvalRequired,
          isActive: result.data.isActive,
          startDate,
          endDate,
        },
      });

      await tx.challengeField.deleteMany({
        where: { challengeId: existingChallenge.id },
      });

      await tx.challengeField.createMany({
        data: result.data.fields.map((field, index) => ({
          challengeId: existingChallenge.id,
          key: field.key,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || null,
          helpText: field.helpText || null,
          required: field.required,
          sortOrder: index,
        })),
      });
    });

    revalidatePath("/challenges");
    return { success: true };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}

export async function deleteChallengeAction(data: z.infer<typeof deleteChallengeSchema>) {
  const result = deleteChallengeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user: currentUser } = await getActionAuthContext("challenges.manage");
    assertManagePermission(currentUser.role);

    const challenge = await prisma.challenge.findFirst({
      where: {
        id: result.data.challengeId,
        tenantId: currentUser.tenantId!,
      },
      select: {
        id: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!challenge) {
      return { error: "Challenge not found." };
    }

    if (challenge._count.submissions > 0) {
      return {
        error: "Challenges with submissions cannot be deleted. Set the challenge to inactive instead.",
      };
    }

    await prisma.challenge.delete({
      where: { id: challenge.id },
    });

    revalidatePath("/challenges");
    return { success: true };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}

export async function submitChallengeAction(data: z.infer<typeof submitChallengeSchema>) {
  const result = submitChallengeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user: currentUser } = await getActionAuthContext("challenges.submit");

    const challenge = await prisma.challenge.findFirst({
      where: {
        id: result.data.challengeId,
        tenantId: currentUser.tenantId!,
      },
      include: {
        fields: {
          orderBy: { sortOrder: "asc" },
        },
        submissions: {
          where: {
            userId: currentUser.id,
            status: {
              in: ["PENDING", "APPROVED"],
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!challenge) {
      return { error: "Challenge not found." };
    }

    if (!challenge.isActive) {
      return { error: "Challenge is inactive." };
    }

    const now = new Date();
    if (challenge.startDate && now < challenge.startDate) {
      return { error: "This challenge is not open yet." };
    }

    if (challenge.endDate && now > challenge.endDate) {
      return { error: "This challenge has closed." };
    }

    if (challenge.submissions.length > 0) {
      return { error: "You have already submitted this challenge." };
    }

    const fieldMap = new Map(challenge.fields.map((field) => [field.key, field]));
    const answerMap = new Map(
      result.data.answers.map((answer) => [answer.key, answer.value.trim()])
    );

    for (const field of challenge.fields) {
      const value = answerMap.get(field.key) ?? "";

      if (field.required && !value) {
        return { error: `${field.label} is required.` };
      }

      if (!value) {
        continue;
      }

      if (field.type === "LINK") {
        try {
          const url = new URL(value);
          if (!["http:", "https:"].includes(url.protocol)) {
            return { error: `${field.label} must be a valid http or https link.` };
          }
        } catch {
          return { error: `${field.label} must be a valid link.` };
        }
      }
    }

    for (const key of answerMap.keys()) {
      if (!fieldMap.has(key)) {
        return { error: "Submission contains an unexpected field." };
      }
    }

    const responsePayload = challenge.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      value: answerMap.get(field.key) ?? "",
    }));

    if (challenge.approvalRequired) {
      await prisma.challengeSubmission.create({
        data: {
          tenantId: currentUser.tenantId!,
          challengeId: challenge.id,
          userId: currentUser.id,
          pointsAwarded: challenge.pointsAward,
          status: "PENDING",
          formResponse: responsePayload,
        },
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.challengeSubmission.create({
          data: {
            tenantId: currentUser.tenantId!,
            challengeId: challenge.id,
            userId: currentUser.id,
            pointsAwarded: challenge.pointsAward,
            status: "APPROVED",
            formResponse: responsePayload,
            reviewedAt: now,
          },
        });

        await tx.wallet.upsert({
          where: {
            tenantId_userId: {
              tenantId: currentUser.tenantId!,
              userId: currentUser.id,
            },
          },
          update: {
            totalPoints: { increment: challenge.pointsAward },
          },
          create: {
            tenantId: currentUser.tenantId!,
            userId: currentUser.id,
            totalPoints: challenge.pointsAward,
            reservedPoints: 0,
          },
        });

        await tx.pointLedger.create({
          data: {
            tenantId: currentUser.tenantId!,
            fromUserId: null,
            toUserId: currentUser.id,
            amount: challenge.pointsAward,
            type: "CHALLENGE",
          },
        });
      });
    }

    revalidatePath("/challenges");
    revalidatePath("/points");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}

export async function reviewChallengeSubmissionAction(
  data: z.infer<typeof reviewChallengeSchema>
) {
  const result = reviewChallengeSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { user: currentUser } = await getActionAuthContext("challenges.review");
    assertReviewPermission(currentUser.role);

    if (result.data.decision === "REJECT" && !result.data.rejectionReason?.trim()) {
      return { error: "A rejection reason is required." };
    }

    const submission = await prisma.challengeSubmission.findFirst({
      where: {
        id: result.data.submissionId,
        tenantId: currentUser.tenantId!,
      },
      include: {
        challenge: {
          select: { id: true, title: true, approvalRequired: true },
        },
      },
    });

    if (!submission) {
      return { error: "Challenge submission not found." };
    }

    if (submission.status !== "PENDING") {
      return { error: "Only pending submissions can be reviewed." };
    }

    const reviewedAt = new Date();

    if (result.data.decision === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        await tx.challengeSubmission.update({
          where: { id: submission.id },
          data: {
            status: "APPROVED",
            reviewerId: currentUser.id,
            reviewedAt,
            rejectionReason: null,
          },
        });

        await tx.wallet.upsert({
          where: {
            tenantId_userId: {
              tenantId: currentUser.tenantId!,
              userId: submission.userId,
            },
          },
          update: {
            totalPoints: { increment: submission.pointsAwarded },
          },
          create: {
            tenantId: currentUser.tenantId!,
            userId: submission.userId,
            totalPoints: submission.pointsAwarded,
            reservedPoints: 0,
          },
        });

        await tx.pointLedger.create({
          data: {
            tenantId: currentUser.tenantId!,
            fromUserId: currentUser.id,
            toUserId: submission.userId,
            amount: submission.pointsAwarded,
            type: "CHALLENGE",
          },
        });
      });
    } else {
      await prisma.challengeSubmission.update({
        where: { id: submission.id },
        data: {
          status: "REJECTED",
          reviewerId: currentUser.id,
          reviewedAt,
          rejectionReason: result.data.rejectionReason?.trim() || null,
        },
      });
    }

    revalidatePath("/challenges");
    revalidatePath("/points");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    return { error: getActionErrorMessage(error, "An unexpected error occurred.") };
  }
}
