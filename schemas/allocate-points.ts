import { z } from "zod";

export const allocatePointsFormSchema = z.object({
  toUserId: z.string().min(1, "User is required"),
  amount: z.number().int("Must be an integer").positive("Must be > 0")
});
