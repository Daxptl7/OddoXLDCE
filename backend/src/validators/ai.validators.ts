import { z } from 'zod';

export const aiPlanSchema = z.object({
  destinations: z.string().trim().min(2).max(160),
  durationDays: z.coerce.number().int().min(1).max(45).default(7),
  budget: z.coerce.number().min(0).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  travelStyle: z.string().trim().max(80).optional(),
});

export const aiTripSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(1).max(8).default(3),
});

export const aiOptimizeSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  targetBudget: z.coerce.number().min(0),
});

export type AiPlanInput = z.infer<typeof aiPlanSchema>;
export type AiTripInput = z.infer<typeof aiTripSchema>;
export type AiOptimizeInput = z.infer<typeof aiOptimizeSchema>;
