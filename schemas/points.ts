import { z } from "zod";

export const allocatePointsSchema = z.object({
  toUserId: z.string().min(1, "User ID is required"),
  amount: z.number().int("Amount must be an integer").positive("Amount must be greater than 0"),
});

export const redeemPointsSchema = z.object({
  amount: z.number().int("Amount must be an integer").positive("Amount must be greater than 0"),
});

export const adjustPointsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().int("Amount must be an integer").refine((val) => val !== 0, {
    message: "Amount cannot be 0",
  }),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export type AllocatePointsInput = z.infer<typeof allocatePointsSchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;
export type AdjustPointsInput = z.infer<typeof adjustPointsSchema>;
