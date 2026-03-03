import { z } from "zod";

export const addRewardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  pointsRequired: z.number().int().positive("Points required must be greater than 0"),
  isActive: z.boolean(),
});

export type AddRewardInput = z.infer<typeof addRewardSchema>;

export const editRewardSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  pointsRequired: z.number().int().positive("Points required must be greater than 0"),
  isActive: z.boolean(),
});

export type EditRewardInput = z.infer<typeof editRewardSchema>;
