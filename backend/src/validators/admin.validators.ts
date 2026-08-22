import { z } from 'zod';
import { dateOnly, pagination } from './common.js';

export const listUsersSchema = z.object({
  q: z.string().trim().max(80).optional(),
  role: z.enum(['USER', 'GUIDE', 'ADMIN']).optional(),
  ...pagination,
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'GUIDE', 'ADMIN']),
  /** Required when promoting to GUIDE and the user has no profile yet. */
  cityId: z.coerce.number().int().positive().optional(),
  dailyRate: z.coerce.number().min(0).max(9_999_999).optional(),
});

export const listAdminBookingsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED']).optional(),
  guideId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  ...pagination,
});

/** Everything an admin is allowed to rewrite on a booking, all of it optional. */
export const adminUpdateBookingSchema = z
  .object({
    guideId: z.coerce.number().int().positive().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED']).optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    headcount: z.coerce.number().int().min(1).max(30).optional(),
    adminNote: z.string().trim().max(500).nullable().optional(),
    /** Book over an existing clash on purpose — the API refuses otherwise. */
    force: z.coerce.boolean().default(false),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'force'), {
    message: 'Nothing to update',
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'The last day cannot be before the first day',
    path: ['endDate'],
  });

export const listAdminGuidesSchema = z.object({
  q: z.string().trim().max(80).optional(),
  cityId: z.coerce.number().int().positive().optional(),
  status: z.enum(['all', 'active', 'inactive', 'unverified']).default('all'),
  ...pagination,
});

export const adminUpdateGuideSchema = z
  .object({
    isActive: z.coerce.boolean().optional(),
    isVerified: z.coerce.boolean().optional(),
    cityId: z.coerce.number().int().positive().optional(),
    dailyRate: z.coerce.number().min(0).max(9_999_999).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });
