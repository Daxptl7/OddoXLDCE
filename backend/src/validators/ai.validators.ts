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

export const aiHomeChatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
});

export const aiScheduleSchema = z.object({
  prompt: z.string().trim().min(3).max(2000),
  tripId: z.coerce.number().int().positive().optional(),
});

export const aiFoodSuggestionsSchema = z.object({
  cityName: z.string().trim().min(1).max(100),
  country: z.string().trim().max(100).optional().default(''),
  hotelName: z.string().trim().max(150).optional().nullable(),
  hotelAddress: z.string().trim().max(250).optional().nullable(),
  dietaryPreference: z.string().trim().max(50).optional().default('all'),
});

export type AiPlanInput = z.infer<typeof aiPlanSchema>;
export type AiTripInput = z.infer<typeof aiTripSchema>;
export type AiOptimizeInput = z.infer<typeof aiOptimizeSchema>;
export type AiHomeChatInput = z.infer<typeof aiHomeChatSchema>;
export type AiScheduleInput = z.infer<typeof aiScheduleSchema>;
export type AiFoodSuggestionsInput = z.infer<typeof aiFoodSuggestionsSchema>;
