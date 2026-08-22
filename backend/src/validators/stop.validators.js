import { z } from 'zod';
import { dateOnly, money, timeOnly } from './common.js';

const datesOrdered = (data) =>
  !data.arrivalDate || !data.departureDate || data.departureDate >= data.arrivalDate;

export const createStopSchema = z
  .object({
    cityId: z.coerce.number().int().positive(),
    arrivalDate: dateOnly,
    departureDate: dateOnly,
    transportCost: money.default(0),
    accommodationCost: money.default(0),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(datesOrdered, {
    message: 'Departure must be on or after arrival',
    path: ['departureDate'],
  });

export const updateStopSchema = z
  .object({
    cityId: z.coerce.number().int().positive().optional(),
    arrivalDate: dateOnly.optional(),
    departureDate: dateOnly.optional(),
    transportCost: money.optional(),
    accommodationCost: money.optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' })
  .refine(datesOrdered, {
    message: 'Departure must be on or after arrival',
    path: ['departureDate'],
  });

/**
 * Two accepted shapes so the frontend can send whichever is convenient:
 *   { order: [stopId, stopId, ...] }            -- final left-to-right order
 *   [{ stopId, sortOrder }, ...]                -- explicit positions
 */
export const reorderStopsSchema = z.union([
  z.object({ order: z.array(z.coerce.number().int().positive()).min(1) }),
  z
    .array(
      z.object({
        stopId: z.coerce.number().int().positive(),
        sortOrder: z.coerce.number().int().min(0),
      }),
    )
    .min(1),
  z.object({
    stops: z
      .array(
        z.object({
          stopId: z.coerce.number().int().positive(),
          sortOrder: z.coerce.number().int().min(0),
        }),
      )
      .min(1),
  }),
]);

export const addStopActivitySchema = z.object({
  activityId: z.coerce.number().int().positive(),
  scheduledDate: dateOnly.nullable().optional(),
  scheduledTime: timeOnly.nullable().optional(),
  customCost: money.nullable().optional(),
});

export const updateStopActivitySchema = z
  .object({
    scheduledDate: dateOnly.nullable().optional(),
    scheduledTime: timeOnly.nullable().optional(),
    customCost: money.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });
