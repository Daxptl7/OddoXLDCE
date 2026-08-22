import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { rangesOverlap, toDateOnly } from '../utils/dates.js';

/** One include shape powers the builder, the itinerary view and the calendar. */
export const tripDeepInclude = {
  stops: {
    orderBy: { sortOrder: 'asc' },
    include: {
      city: true,
      activities: {
        orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }, { id: 'asc' }],
        include: { activity: true },
      },
    },
  },
};

export async function getOwnedTrip(tripId, userId, { deep = false } = {}) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    ...(deep ? { include: tripDeepInclude } : {}),
  });
  if (!trip) throw ApiError.notFound('Trip not found');
  if (trip.userId !== userId) throw ApiError.forbidden('This trip belongs to someone else');
  return trip;
}

/** Resolves the stop and proves the caller owns the trip it hangs off. */
export async function getOwnedStop(stopId, userId) {
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
export function buildTripWarnings(trip, stops) {
  const warnings = [];
  const ordered = [...stops].sort((a, b) => a.sortOrder - b.sortOrder);

  for (let i = 0; i < ordered.length; i += 1) {
    const stop = ordered[i];
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
