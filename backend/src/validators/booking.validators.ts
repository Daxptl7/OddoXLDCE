import { z } from 'zod';
import { dateOnly, pagination } from './common.js';

export const createBookingSchema = z
  .object({
    guideId: z.coerce.number().int().positive(),
    tripId: z.coerce.number().int().positive().optional().nullable(),
    startDate: dateOnly,
    endDate: dateOnly,
    headcount: z.coerce.number().int().min(1).max(30).default(1),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'The last day cannot be before the first day',
    path: ['endDate'],
  });

export const listBookingsSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED']).optional(),
  scope: z.enum(['all', 'upcoming', 'past']).default('all'),
  ...pagination,
});

export const cancelBookingSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
