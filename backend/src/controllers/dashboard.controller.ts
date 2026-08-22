import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeCity, serializeTrip } from '../services/serializers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toDateOnly } from '../utils/dates.js';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = toDateOnly(new Date());

  const [recentTrips, upcomingTrips, popularCities, tripCount] = await Promise.all([
    prisma.trip.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { _count: { select: { stops: true } } },
    }),
    prisma.trip.findMany({
      where: { userId: req.user!.id, startDate: { gte: today } },
      orderBy: { startDate: 'asc' },
      take: 3,
      include: { _count: { select: { stops: true } } },
    }),
    prisma.city.findMany({ orderBy: { popularity: 'desc' }, take: 8 }),
    prisma.trip.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({
    user: { name: req.user!.name, photoUrl: req.user!.photoUrl ?? null },
    stats: { tripCount, upcomingCount: upcomingTrips.length },
    recentTrips: recentTrips.map((trip) => serializeTrip(trip, { includeStops: false })),
    upcomingTrips: upcomingTrips.map((trip) => serializeTrip(trip, { includeStops: false })),
    recommendedCities: popularCities.map(serializeCity),
  });
});
