import type { Prisma, Trip, TripStop, City, Activity, StopActivity } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { rangesOverlap, toDateOnly } from '../utils/dates.js';
import type { TripWarning } from '../types/index.js';

type StopActivityLike = StopActivity & { activity?: Activity };
type StopLike = TripStop & { city?: City; activities?: StopActivityLike[] };
type TripWithStops = Trip & { stops: StopLike[] };

/** One include shape powers the builder, the itinerary view and the calendar. */
export const tripDeepInclude = {
  stops: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      city: true,
      activities: {
        orderBy: [
          { scheduledDate: 'asc' as const },
          { scheduledTime: 'asc' as const },
          { id: 'asc' as const },
        ],
        include: { activity: true },
      },
    },
  },
} satisfies Prisma.TripInclude;

export async function getOwnedTrip(
  tripId: number,
  userId: number,
  { deep = false } = {},
): Promise<Trip | TripWithStops> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    ...(deep ? { include: tripDeepInclude } : {}),
  });
  if (!trip) throw ApiError.notFound('Trip not found');
  if (trip.userId !== userId) throw ApiError.forbidden('This trip belongs to someone else');
  return trip;
}

type StopWithTrip = TripStop & {
  trip: { id: number; userId: number; startDate: Date; endDate: Date };
};

/** Resolves the stop and proves the caller owns the trip it hangs off. */
export async function getOwnedStop(stopId: number, userId: number): Promise<StopWithTrip> {
  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    include: { trip: { select: { id: true, userId: true, startDate: true, endDate: true } } },
  });
  if (!stop) throw ApiError.notFound('Stop not found');
  if (stop.trip.userId !== userId) throw ApiError.forbidden('This stop belongs to someone else');
  return stop;
}

/**
 * Non-blocking checks that read as real product thinking in a demo:
 * overlapping stays, stops outside the trip window, and unassigned days.
 */
export function buildTripWarnings(trip: Trip, stops: StopLike[]): TripWarning[] {
  const warnings: TripWarning[] = [];
  const ordered = [...stops].sort((a, b) => a.sortOrder - b.sortOrder);

  for (let i = 0; i < ordered.length; i += 1) {
    const stop = ordered[i]!;
    const cityName = stop.city?.name ?? `Stop ${stop.id}`;

    if (
      toDateOnly(stop.arrivalDate) < toDateOnly(trip.startDate) ||
      toDateOnly(stop.departureDate) > toDateOnly(trip.endDate)
    ) {
      warnings.push({
        type: 'outside_trip_dates',
        stopId: stop.id,
        message: `${cityName} falls outside the trip's date range`,
      });
    }

    const next = ordered[i + 1];
    if (
      next &&
      rangesOverlap(stop.arrivalDate, stop.departureDate, next.arrivalDate, next.departureDate)
    ) {
      warnings.push({
        type: 'overlapping_stops',
        stopId: stop.id,
        message: `${cityName} overlaps with ${next.city?.name ?? 'the next stop'}`,
      });
    }

    if ((stop.activities?.length ?? 0) === 0) {
      warnings.push({
        type: 'empty_stop',
        stopId: stop.id,
        message: `${cityName} has no activities planned yet`,
      });
    }
  }

  return warnings;
}
