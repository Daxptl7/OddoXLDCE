import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getTripBudget } from '../services/budget.service.js';
import { buildItinerary } from '../services/itinerary.service.js';
import { serializeTrip } from '../services/serializers.js';
import { tripDeepInclude } from '../services/trip.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * NO AUTH. Read-only. Reached by random slug, never by trip id, and only while
 * the owner has sharing switched on.
 */
export const getPublicTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await prisma.trip.findUnique({
    where: { shareSlug: req.params.slug as string },
    include: { ...tripDeepInclude, user: { select: { name: true, photoUrl: true } } },
  });

  if (!trip || !trip.isPublic) throw ApiError.notFound('This trip is not shared');

  const [budget] = await Promise.all([getTripBudget(trip)]);
  const serialized = serializeTrip(trip);

  res.json({
    trip: {
      ...serialized,
      // A read-only viewer has no business knowing who owns the row or how to reshare it.
      userId: undefined,
      shareSlug: undefined,
    },
    itinerary: buildItinerary(trip),
    budget,
    readOnly: true,
  });
});
