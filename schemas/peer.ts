import { z } from "zod";

export const sendPeerPointsSchema = z
  .object({
    toUserId: z.string().min(1, "Recipient is required"),
    amount: z.number().int("Amount must be an integer").positive("Amount must be greater than 0").optional(),
    categoryId: z.string().min(1).optional(),
    message: z
      .string()
      .trim()
      .max(280, "Message cannot exceed 280 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId && data.amount === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Amount must be greater than 0",
        path: ["amount"],
      });
    }
  });

export type SendPeerPointsInput = z.infer<typeof sendPeerPointsSchema>;
