import { z } from "zod";

export const allocationFrequencySchema = z.enum([
  "DAILY",
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUALLY",
  "ANNUALLY",
]);

export const pointsSettingsSchema = z.object({
  managerAllocationLimit: z
    .number()
    .int("Manager allocation limit must be an integer")
    .positive("Manager allocation limit must be greater than 0"),
  managerAllocationFrequency: allocationFrequencySchema,
  peerAllocationLimit: z
    .number()
    .int("Peer allocation limit must be an integer")
    .positive("Peer allocation limit must be greater than 0"),
  peerAllocationFrequency: allocationFrequencySchema,
});

export type PointsSettingsInput = z.infer<typeof pointsSettingsSchema>;
