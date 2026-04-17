import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be at most 80 characters"),
  description: z.string().trim().max(300, "Description must be at most 300 characters").optional(),
  points: z
    .number()
    .int("Points must be an integer")
    .positive("Points must be greater than 0"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1, "Category ID is required"),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const toggleCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
});

export type ToggleCategoryInput = z.infer<typeof toggleCategorySchema>;
