import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getTripBudget } from '../services/budget.service.js';
import { buildItinerary } from '../services/itinerary.service.js';
import { serializeTrip } from '../services/serializers.js';
import { buildTripWarnings, getOwnedTrip, tripDeepInclude } from '../services/trip.service.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateShareSlug } from '../utils/auth.js';
import { toDateOnly } from '../utils/dates.js';

const shareUrl = (slug: string): string => `${env.publicAppUrl.replace(/\/$/, '')}/t/${slug}`;

export const listTrips = asyncHandler(async (req: Request, res: Response) => {
  const { q, scope, limit, offset } = req.validatedQuery as Record<string, unknown>;
  const today = toDateOnly(new Date());

  const where = {
    userId: req.user!.id,
    ...(q ? { name: { contains: q as string, mode: 'insensitive' as const } } : {}),
    ...(scope === 'upcoming' ? { endDate: { gte: today } } : {}),
    ...(scope === 'past' ? { endDate: { lt: today } } : {}),
  };

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      take: limit as number,
      skip: offset as number,
      include: { _count: { select: { stops: true } } },
    }),
    prisma.trip.count({ where }),
  ]);

  res.json({
    trips: trips.map((trip) => serializeTrip(trip, { includeStops: false })),
    total,
    limit,
    offset,
  });
});

export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, ...rest } = req.body;

  const trip = await prisma.trip.create({
    data: {
      ...rest,
      startDate: toDateOnly(startDate),
      endDate: toDateOnly(endDate),
      userId: req.user!.id,
    },
  });

  res.status(201).json({ trip: serializeTrip(trip, { includeStops: false }) });
});

/** The deep read: stops + cities + activities in one fetch, plus derived extras. */
export const getTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await getOwnedTrip(Number(req.params.id), req.user!.id, { deep: true });

  // deep=true guarantees stops are included; cast to satisfy serializer types
  const deepTrip = trip as any;
  res.json({
    trip: serializeTrip(deepTrip),
    warnings: buildTripWarnings(trip, deepTrip.stops),
    shareUrl: trip.shareSlug ? shareUrl(trip.shareSlug) : null,
  });
});

export const updateTrip = asyncHandler(async (req: Request, res: Response) => {
  const existing = await getOwnedTrip(Number(req.params.id), req.user!.id);
  const { startDate, endDate, isPublic, ...rest } = req.body;

  const nextStart = startDate ? toDateOnly(startDate) : existing.startDate;
  const nextEnd = endDate ? toDateOnly(endDate) : existing.endDate;
  if (nextEnd < nextStart) {
    throw ApiError.badRequest('End date must be on or after the start date');
  }

  const trip = await prisma.trip.update({
    where: { id: existing.id },
    data: {
      ...rest,
      startDate: nextStart,
      endDate: nextEnd,
      ...(isPublic === undefined ? {} : { isPublic }),
      // Turning sharing on without ever calling /share should still produce a link.
      ...(isPublic && !existing.shareSlug ? { shareSlug: generateShareSlug() } : {}),
    },
  });

  res.json({ trip: serializeTrip(trip, { includeStops: false }) });
});

export const deleteTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await getOwnedTrip(Number(req.params.id), req.user!.id);
  await prisma.trip.delete({ where: { id: trip.id } });
  res.json({ ok: true, deletedId: trip.id });
});

/** Derived budget — never a stored total. */
export const getBudget = asyncHandler(async (req: Request, res: Response) => {
  const trip = await getOwnedTrip(Number(req.params.id), req.user!.id);
  res.json({ budget: await getTripBudget(trip) });
});

export const getItinerary = asyncHandler(async (req: Request, res: Response) => {
  const trip = await getOwnedTrip(Number(req.params.id), req.user!.id, { deep: true });
  res.json({ itinerary: buildItinerary(trip as any) });
});

/** Generates the share slug once and reuses it, so a shared link never goes dead. */
export const shareTrip = asyncHandler(async (req: Request, res: Response) => {
  const existing = await getOwnedTrip(Number(req.params.id), req.user!.id);

  const trip = await prisma.trip.update({
    where: { id: existing.id },
    data: {
      isPublic: true,
      shareSlug: existing.shareSlug ?? generateShareSlug(),
    },
  });

  res.json({ shareSlug: trip.shareSlug, shareUrl: shareUrl(trip.shareSlug!), isPublic: true });
});

export const unshareTrip = asyncHandler(async (req: Request, res: Response) => {
  const existing = await getOwnedTrip(Number(req.params.id), req.user!.id);
  await prisma.trip.update({ where: { id: existing.id }, data: { isPublic: false } });
  res.json({ ok: true, isPublic: false });
});

/** Duplicates a trip with all its stops and activities — powers "Copy this trip". */
export const copyTrip = asyncHandler(async (req: Request, res: Response) => {
  const source = await prisma.trip.findUnique({
    where: { id: Number(req.params.id) },
    include: tripDeepInclude,
  });
  if (!source) throw ApiError.notFound('Trip not found');
  if (source.userId !== req.user!.id && !source.isPublic) {
    throw ApiError.forbidden('This trip is not shared with you');
  }

  const copy = await prisma.trip.create({
    data: {
      userId: req.user!.id,
      name: `${source.name} (copy)`,
      description: source.description,
      startDate: source.startDate,
      endDate: source.endDate,
      coverPhotoUrl: source.coverPhotoUrl,
      targetBudget: source.targetBudget,
      isPublic: false,
      stops: {
        create: source.stops.map((stop) => ({
          cityId: stop.cityId,
          arrivalDate: stop.arrivalDate,
          departureDate: stop.departureDate,
          sortOrder: stop.sortOrder,
          transportCost: stop.transportCost,
          accommodationCost: stop.accommodationCost,
          notes: stop.notes,
          activities: {
            create: stop.activities.map((link) => ({
              activityId: link.activityId,
              scheduledDate: link.scheduledDate,
              scheduledTime: link.scheduledTime,
              customCost: link.customCost,
            })),
          },
        })),
      },
    },
    include: tripDeepInclude,
  });

  res.status(201).json({ trip: serializeTrip(copy) });
});
