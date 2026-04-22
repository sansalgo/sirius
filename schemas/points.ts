import { z } from "zod";

export const allocatePointsSchema = z.object({
  toUserId: z.string().min(1, "User ID is required"),
  amount: z.number().int("Amount must be an integer").positive("Amount must be greater than 0"),
});

export type AllocatePointsInput = z.infer<typeof allocatePointsSchema>;
