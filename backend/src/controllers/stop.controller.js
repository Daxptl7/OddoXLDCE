import { prisma } from '../lib/prisma.js';
import { serializeStop, serializeStopActivity } from '../services/serializers.js';
import {
  nextSortOrder,
  readOrderPayload,
  reorderStops,
  shiftStopActivities,
} from '../services/stop.service.js';
import { getOwnedStop, getOwnedTrip } from '../services/trip.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { daysBetween, toDateOnly } from '../utils/dates.js';

const stopInclude = {
  city: true,
  activities: {
    orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }, { id: 'asc' }],
    include: { activity: true },
  },
};

export const listStops = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const stops = await prisma.tripStop.findMany({
    where: { tripId: trip.id },
    orderBy: { sortOrder: 'asc' },
    include: stopInclude,
  });
  res.json({ stops: stops.map(serializeStop) });
});

export const addStop = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const { cityId, arrivalDate, departureDate, ...rest } = req.body;

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw ApiError.badRequest('That city is not in the catalogue');

  const stop = await prisma.tripStop.create({
    data: {
      ...rest,
      tripId: trip.id,
      cityId,
      arrivalDate: toDateOnly(arrivalDate),
      departureDate: toDateOnly(departureDate),
      sortOrder: await nextSortOrder(trip.id),
    },
    include: stopInclude,
  });

  res.status(201).json({ stop: serializeStop(stop) });
});

export const updateStop = asyncHandler(async (req, res) => {
  const existing = await getOwnedStop(req.params.stopId, req.user.id);
  const { arrivalDate, departureDate, ...rest } = req.body;

  const nextArrival = arrivalDate ? toDateOnly(arrivalDate) : existing.arrivalDate;
  const nextDeparture = departureDate ? toDateOnly(departureDate) : existing.departureDate;
  if (nextDeparture < nextArrival) {
    throw ApiError.badRequest('Departure must be on or after arrival');
  }

  const delta = daysBetween(existing.arrivalDate, nextArrival);

  const stop = await prisma.$transaction(async (tx) => {
    await tx.tripStop.update({
      where: { id: existing.id },
      data: { ...rest, arrivalDate: nextArrival, departureDate: nextDeparture },
    });
    // Scheduled activities move with the stop rather than being left behind on
    // dates the stop no longer covers.
    await shiftStopActivities(tx, existing, delta, nextArrival, nextDeparture);
    return tx.tripStop.findUnique({ where: { id: existing.id }, include: stopInclude });
  });

  res.json({ stop: serializeStop(stop) });
});

export const deleteStop = asyncHandler(async (req, res) => {
  const stop = await getOwnedStop(req.params.stopId, req.user.id);
  await prisma.tripStop.delete({ where: { id: stop.id } });
  res.json({ ok: true, deletedId: stop.id });
});

export const reorder = asyncHandler(async (req, res) => {
  const trip = await getOwnedTrip(req.params.id, req.user.id);
  const orderedIds = readOrderPayload(req.body);
  const keepDates = req.query.keepDates === 'true';

  const stops = await reorderStops(trip.id, orderedIds, { keepDates });
  res.json({ stops: stops.map(serializeStop), datesReflowed: !keepDates });
});

export const addActivityToStop = asyncHandler(async (req, res) => {
  const stop = await getOwnedStop(req.params.stopId, req.user.id);
  const { activityId, scheduledDate, ...rest } = req.body;

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw ApiError.badRequest('That activity is not in the catalogue');
  // Activities are city-scoped: a Louvre tour cannot be attached to the Rome stop.
  if (activity.cityId !== stop.cityId) {
    throw ApiError.badRequest('That activity belongs to a different city than this stop');
  }

  if (scheduledDate) {
    const date = toDateOnly(scheduledDate);
    if (date < stop.arrivalDate || date > stop.departureDate) {
      throw ApiError.badRequest('Schedule the activity between arrival and departure', {
        arrivalDate: stop.arrivalDate.toISOString().slice(0, 10),
        departureDate: stop.departureDate.toISOString().slice(0, 10),
      });
    }
  }

  const link = await prisma.stopActivity.create({
    data: {
      ...rest,
      tripStopId: stop.id,
      activityId,
      scheduledDate: scheduledDate ? toDateOnly(scheduledDate) : null,
    },
    include: { activity: true },
  });

  res.status(201).json({ stopActivity: serializeStopActivity(link) });
});

/** Loads a stop_activities row and proves the caller owns the trip behind it. */
async function getOwnedStopActivity(id, userId) {
  const link = await prisma.stopActivity.findUnique({
    where: { id: Number(id) },
    include: { activity: true, tripStop: { include: { trip: { select: { userId: true } } } } },
  });
  if (!link) throw ApiError.notFound('Activity not found on this trip');
  if (link.tripStop.trip.userId !== userId) throw ApiError.forbidden();
  return link;
}

export const updateStopActivity = asyncHandler(async (req, res) => {
  const existing = await getOwnedStopActivity(req.params.id, req.user.id);
  const { scheduledDate, ...rest } = req.body;

  const link = await prisma.stopActivity.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(scheduledDate === undefined
        ? {}
        : { scheduledDate: scheduledDate ? toDateOnly(scheduledDate) : null }),
    },
    include: { activity: true },
  });

  res.json({ stopActivity: serializeStopActivity(link) });
});

export const removeStopActivity = asyncHandler(async (req, res) => {
  const link = await getOwnedStopActivity(req.params.id, req.user.id);
  await prisma.stopActivity.delete({ where: { id: link.id } });
  res.json({ ok: true, deletedId: link.id });
});
