import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { addDays, daysBetween, nightsBetween, toDateOnly } from '../utils/dates.js';

/** Gaps of 10 so a stop can be inserted between two others without renumbering. */
export const SORT_GAP = 10;

export async function nextSortOrder(tripId, client = prisma) {
  const last = await client.tripStop.findFirst({
    where: { tripId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? 0) + SORT_GAP;
}

/**
 * Normalises the request body of PATCH /trips/:id/stops/reorder into a list of
 * stop ids in their new left-to-right order.
 */
export function readOrderPayload(body) {
  if (Array.isArray(body)) {
    return [...body].sort((a, b) => a.sortOrder - b.sortOrder).map((entry) => entry.stopId);
  }
  if (Array.isArray(body?.stops)) {
    return [...body.stops].sort((a, b) => a.sortOrder - b.sortOrder).map((entry) => entry.stopId);
  }
  return body.order;
}

/**
 * Reordering re-flows the dates. Each stop keeps the number of nights it had and
 * the stays are re-chained back-to-back from the trip's start date, so a drag can
 * never leave the itinerary with dates that contradict the order. Pass
 * keepDates:true to move the cards only and leave every date untouched.
 */
export async function reorderStops(tripId, orderedStopIds, { keepDates = false } = {}) {
  return prisma.$transaction(async (tx) => {
    const stops = await tx.tripStop.findMany({
      where: { tripId },
      orderBy: { sortOrder: 'asc' },
    });

    if (stops.length === 0) throw ApiError.badRequest('This trip has no stops to reorder');

    const known = new Set(stops.map((stop) => stop.id));
    const seen = new Set();
    for (const id of orderedStopIds) {
      if (!known.has(id)) throw ApiError.badRequest(`Stop ${id} is not part of this trip`);
      if (seen.has(id)) throw ApiError.badRequest(`Stop ${id} was listed twice`);
      seen.add(id);
    }
    if (seen.size !== stops.length) {
      throw ApiError.badRequest('Send every stop of the trip in the new order', {
        expected: stops.length,
        received: seen.size,
      });
    }

    const byId = new Map(stops.map((stop) => [stop.id, stop]));
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      select: { startDate: true },
    });

    // Phase 1: park every row on a negative sort_order so the UNIQUE(trip_id,
    // sort_order) constraint cannot trip while the new values are written.
    for (const [index, stopId] of orderedStopIds.entries()) {
      await tx.tripStop.update({
        where: { id: stopId },
        data: { sortOrder: -(index + 1) },
      });
    }

    // Phase 2: write the final positions, re-flowing dates unless asked not to.
    let cursor = toDateOnly(trip.startDate);
    const shifts = [];
    for (const [index, stopId] of orderedStopIds.entries()) {
      const stop = byId.get(stopId);
      const data = { sortOrder: (index + 1) * SORT_GAP };

      if (!keepDates) {
        const nights = nightsBetween(stop.arrivalDate, stop.departureDate);
        data.arrivalDate = cursor;
        data.departureDate = addDays(cursor, nights);
        shifts.push({
          stop,
          delta: daysBetween(stop.arrivalDate, cursor),
          arrivalDate: data.arrivalDate,
          departureDate: data.departureDate,
        });
        cursor = addDays(cursor, nights);
      }

      await tx.tripStop.update({ where: { id: stopId }, data });
    }

    // Phase 3: the scheduled activities follow their stop to its new dates.
    for (const shift of shifts) {
      await shiftStopActivities(
        tx,
        shift.stop,
        shift.delta,
        shift.arrivalDate,
        shift.departureDate,
      );
    }

    return tx.tripStop.findMany({
      where: { tripId },
      orderBy: { sortOrder: 'asc' },
      include: {
        city: true,
        activities: { include: { activity: true } },
      },
    });
  });
}

/**
 * Moves a stop's scheduled activities along with the stop. Everything shifts by
 * the same number of days the arrival moved, then anything left outside the new
 * window is clamped back into it — a stop's activities can never sit on a day
 * that belongs to another city.
 */
export async function shiftStopActivities(tx, stop, deltaDays, arrivalDate, departureDate) {
  const links = await tx.stopActivity.findMany({
    where: { tripStopId: stop.id, scheduledDate: { not: null } },
    select: { id: true, scheduledDate: true },
  });

  for (const link of links) {
    let next = addDays(link.scheduledDate, deltaDays);
    if (next < arrivalDate) next = toDateOnly(arrivalDate);
    if (next > departureDate) next = toDateOnly(departureDate);

    if (next.getTime() !== toDateOnly(link.scheduledDate).getTime()) {
      await tx.stopActivity.update({ where: { id: link.id }, data: { scheduledDate: next } });
    }
  }
}
