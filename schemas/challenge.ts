import { z } from "zod";

export const challengeFieldTypes = ["TEXT", "TEXTAREA", "LINK"] as const;

const challengeFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Field key must be at least 2 characters")
    .max(40, "Field key must be at most 40 characters")
    .regex(/^[a-z0-9_]+$/, "Field key must use lowercase letters, numbers, or underscores"),
  label: z.string().trim().min(2, "Field label must be at least 2 characters").max(80),
  type: z.enum(challengeFieldTypes),
  placeholder: z.string().trim().max(120, "Placeholder must be at most 120 characters").optional(),
  helpText: z.string().trim().max(200, "Help text must be at most 200 characters").optional(),
  required: z.boolean(),
});

export const createChallengeSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
    description: z.string().trim().max(300, "Description must be at most 300 characters").optional(),
    instructions: z.string().trim().max(500, "Instructions must be at most 500 characters").optional(),
    pointsAward: z.number().int("Points must be an integer").positive("Points must be greater than 0"),
    approvalRequired: z.boolean(),
    isActive: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    fields: z.array(challengeFieldSchema).min(1, "At least one form field is required").max(12),
  })
  .superRefine((data, ctx) => {
    const normalizedKeys = data.fields.map((field) => field.key);
    const uniqueKeys = new Set(normalizedKeys);
    if (uniqueKeys.size !== normalizedKeys.length) {
      ctx.addIssue({
        code: "custom",
        message: "Field keys must be unique within a challenge",
        path: ["fields"],
      });
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        ctx.addIssue({
          code: "custom",
          message: "Challenge dates are invalid",
          path: ["startDate"],
        });
        return;
      }

      if (endDate < startDate) {
        ctx.addIssue({
          code: "custom",
          message: "End date must be after start date",
          path: ["endDate"],
        });
      }
    }
  });

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export const updateChallengeSchema = createChallengeSchema.extend({
  id: z.string().min(1, "Challenge ID is required"),
});

export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;

export const challengeAnswerSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().max(2000, "Response is too long"),
});

export const submitChallengeSchema = z.object({
  challengeId: z.string().min(1, "Challenge is required"),
  answers: z.array(challengeAnswerSchema).min(1, "Challenge form cannot be empty"),
});

export type SubmitChallengeInput = z.infer<typeof submitChallengeSchema>;

export const reviewChallengeSchema = z.object({
  submissionId: z.string().min(1, "Submission is required"),
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().trim().max(300, "Reason must be at most 300 characters").optional(),
});

export type ReviewChallengeInput = z.infer<typeof reviewChallengeSchema>;

export const deleteChallengeSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
});

export type DeleteChallengeInput = z.infer<typeof deleteChallengeSchema>;
