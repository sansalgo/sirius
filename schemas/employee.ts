import { z } from "zod";

export const addEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]),
});

export type AddEmployeeInput = z.infer<typeof addEmployeeSchema>;

export const editEmployeeSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"]),
});

export type EditEmployeeInput = z.infer<typeof editEmployeeSchema>;
