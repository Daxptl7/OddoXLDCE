import { z } from 'zod';
import { dateOnly, money } from './common.js';

const base = {
  name: z.string().trim().min(2, 'Give your trip a name').max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  startDate: dateOnly,
  endDate: dateOnly,
  coverPhotoUrl: z.string().url().max(500).nullable().optional(),
  targetBudget: money.nullable().optional(),
};

const endsAfterStart = (data: { startDate?: string; endDate?: string }): boolean =>
  !data.startDate || !data.endDate || data.endDate >= data.startDate;

export const createTripSchema = z
  .object(base)
  .refine(endsAfterStart, { message: 'End date must be on or after the start date', path: ['endDate'] });

export const updateTripSchema = z
  .object({
    name: base.name.optional(),
    description: base.description,
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    coverPhotoUrl: base.coverPhotoUrl,
    targetBudget: base.targetBudget,
    isPublic: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' })
  .refine(endsAfterStart, { message: 'End date must be on or after the start date', path: ['endDate'] });

export const listTripsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  scope: z.enum(['all', 'upcoming', 'past']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type ListTripsInput = z.infer<typeof listTripsSchema>;
