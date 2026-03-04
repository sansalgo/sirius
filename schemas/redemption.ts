import { z } from "zod";

export const redeemRewardSchema = z.object({
  rewardId: z.string().min(1, "Reward ID is required"),
});

export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;

export const rejectRedemptionSchema = z.object({
  redemptionId: z.string().min(1, "Redemption ID is required"),
  reason: z.string().min(3, "Rejection reason must be at least 3 characters"),
});

export type RejectRedemptionInput = z.infer<typeof rejectRedemptionSchema>;
