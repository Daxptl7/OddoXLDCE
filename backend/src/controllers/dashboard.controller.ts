import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { bookingInclude } from '../services/guide.service.js';
import { serializeBooking, serializeCity, serializeTrip } from '../services/serializers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toDateOnly } from '../utils/dates.js';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = toDateOnly(new Date());

  const [recentTrips, upcomingTrips, popularCities, tripCount, guideBookings] = await Promise.all([
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
    // The guides this traveller has hired for days that haven't happened yet.
    prisma.guideBooking.findMany({
      where: {
        touristId: req.user!.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        endDate: { gte: today },
      },
      orderBy: { startDate: 'asc' },
      take: 3,
      include: bookingInclude,
    }),
  ]);

  res.json({
    user: { name: req.user!.name, photoUrl: req.user!.photoUrl ?? null, role: req.user!.role },
    stats: { tripCount, upcomingCount: upcomingTrips.length, guideCount: guideBookings.length },
    recentTrips: recentTrips.map((trip) => serializeTrip(trip, { includeStops: false })),
    upcomingTrips: upcomingTrips.map((trip) => serializeTrip(trip, { includeStops: false })),
    recommendedCities: popularCities.map(serializeCity),
    guideBookings: guideBookings.map((booking) => serializeBooking(booking)),
  });
});
