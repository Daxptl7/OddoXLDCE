import { z } from 'zod';
import { dateOnly, money, pagination } from './common.js';

const stringList = z.array(z.string().trim().min(1).max(40)).max(12);

/** The profile half of a guide signup — reused by signup and by admin creation. */
export const guideProfileSchema = z.object({
  cityId: z.coerce.number().int().positive('Pick the city you guide in'),
  headline: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  languages: stringList.default([]),
  specialties: stringList.default([]),
  dailyRate: money,
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
});

export const updateGuideProfileSchema = z
  .object({
    cityId: z.coerce.number().int().positive().optional(),
    headline: z.string().trim().max(120).nullable().optional(),
    bio: z.string().trim().max(1000).nullable().optional(),
    languages: stringList.optional(),
    specialties: stringList.optional(),
    dailyRate: money.optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export const listGuidesSchema = z.object({
  q: z.string().trim().max(80).optional(),
  cityId: z.coerce.number().int().positive().optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  language: z.string().trim().max(40).optional(),
  maxRate: money.optional(),
  startDate: dateOnly.optional(),
  endDate: dateOnly.optional(),
  sort: z.enum(['rating', 'price', 'experience']).default('rating'),
  ...pagination,
});

export const guideBookingActionSchema = z.object({
  status: z.enum(['CONFIRMED', 'DECLINED', 'COMPLETED']),
  guideNote: z.string().trim().max(500).nullable().optional(),
});

export const listGuideBookingsSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED']).optional(),
  scope: z.enum(['all', 'upcoming', 'past']).default('all'),
  ...pagination,
});

export type GuideProfileInput = z.infer<typeof guideProfileSchema>;
