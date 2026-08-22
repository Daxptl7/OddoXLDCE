import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  assertTransition,
  BLOCKING_STATUSES,
  bookingInclude,
  getGuideOr404,
  getOwnGuideProfile,
  guideInclude,
} from '../services/guide.service.js';
import { serializeBooking, serializeGuide } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toDateOnly } from '../utils/dates.js';

const sortOrder: Record<string, Prisma.GuideProfileOrderByWithRelationInput[]> = {
  rating: [{ rating: 'desc' }, { experienceYears: 'desc' }],
  price: [{ dailyRate: 'asc' }, { rating: 'desc' }],
  experience: [{ experienceYears: 'desc' }, { rating: 'desc' }],
};

/**
 * The public-facing directory: active guides, optionally narrowed to a city and
 * to a date window. Contact details are withheld until a booking is confirmed.
 */
export const listGuides = asyncHandler(async (req: Request, res: Response) => {
  const { q, cityId, city, country, language, maxRate, startDate, endDate, sort, limit, offset } =
    req.validatedQuery as Record<string, unknown>;

  const where: Prisma.GuideProfileWhereInput = {
    isActive: true,
    ...(cityId ? { cityId: cityId as number } : {}),
    ...(city || country
      ? {
          city: {
            ...(city ? { name: { equals: city as string, mode: 'insensitive' as const } } : {}),
            ...(country ? { country: { equals: country as string, mode: 'insensitive' as const } } : {}),
          },
        }
      : {}),
    ...(language ? { languages: { has: language as string } } : {}),
    ...(maxRate !== undefined ? { dailyRate: { lte: maxRate as number } } : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q as string, mode: 'insensitive' as const } } },
            { headline: { contains: q as string, mode: 'insensitive' as const } },
            { city: { name: { contains: q as string, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  // Asking for dates filters the list down to who is actually free then.
  if (startDate && endDate) {
    where.bookings = {
      none: {
        status: { in: BLOCKING_STATUSES },
        startDate: { lte: toDateOnly(endDate as string) },
        endDate: { gte: toDateOnly(startDate as string) },
      },
    };
  }

  const [guides, total] = await Promise.all([
    prisma.guideProfile.findMany({
      where,
      orderBy: sortOrder[sort as string] ?? sortOrder.rating,
      take: limit as number,
      skip: offset as number,
      include: guideInclude,
    }),
    prisma.guideProfile.count({ where }),
  ]);

  res.json({
    guides: guides.map((guide) => serializeGuide(guide)),
    total,
    limit,
    offset,
  });
});

/** One guide plus the day ranges already taken, so the booking form can warn early. */
export const getGuide = asyncHandler(async (req: Request, res: Response) => {
  const guide = await getGuideOr404(Number(req.params.id));

  const busy = await prisma.guideBooking.findMany({
    where: { guideId: guide.id, status: { in: BLOCKING_STATUSES } },
    orderBy: { startDate: 'asc' },
    select: { startDate: true, endDate: true },
  });

  res.json({
    guide: serializeGuide(guide, { includeContact: req.user!.role === 'ADMIN' }),
    busyRanges: busy.map((range) => ({
      startDate: range.startDate.toISOString().slice(0, 10),
      endDate: range.endDate.toISOString().slice(0, 10),
    })),
  });
});

// ── The guide's own workspace ────────────────────────────────────────

export const getMyGuideProfile = asyncHandler(async (req: Request, res: Response) => {
  const guide = await getOwnGuideProfile(req.user!.id);
  res.json({ guide: serializeGuide(guide, { includeContact: true }) });
});

export const updateMyGuideProfile = asyncHandler(async (req: Request, res: Response) => {
  const existing = await getOwnGuideProfile(req.user!.id);

  if (req.body.cityId && req.body.cityId !== existing.cityId) {
    const city = await prisma.city.findUnique({ where: { id: req.body.cityId } });
    if (!city) throw ApiError.badRequest('That city is not in our catalogue yet');
  }

  const guide = await prisma.guideProfile.update({
    where: { id: existing.id },
    data: req.body,
    include: guideInclude,
  });

  res.json({ guide: serializeGuide(guide, { includeContact: true }) });
});

/** Everyone assigned to this guide, newest first, filtered by status or window. */
export const listMyAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { status, scope, limit, offset } = req.validatedQuery as Record<string, unknown>;
  const guide = await getOwnGuideProfile(req.user!.id);
  const today = toDateOnly(new Date());

  const where: Prisma.GuideBookingWhereInput = {
    guideId: guide.id,
    ...(status ? { status: status as never } : {}),
    ...(scope === 'upcoming' ? { endDate: { gte: today } } : {}),
    ...(scope === 'past' ? { endDate: { lt: today } } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.guideBooking.findMany({
      where,
      orderBy: [{ startDate: 'asc' }, { id: 'desc' }],
      take: limit as number,
      skip: offset as number,
      include: bookingInclude,
    }),
    prisma.guideBooking.count({ where }),
  ]);

  const [pending, confirmed, upcoming, earnings] = await Promise.all([
    prisma.guideBooking.count({ where: { guideId: guide.id, status: 'PENDING' } }),
    prisma.guideBooking.count({ where: { guideId: guide.id, status: 'CONFIRMED' } }),
    prisma.guideBooking.count({
      where: { guideId: guide.id, status: 'CONFIRMED', startDate: { gte: today } },
    }),
    prisma.guideBooking.aggregate({
      where: { guideId: guide.id, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _sum: { totalCost: true, days: true },
    }),
  ]);

  res.json({
    guide: serializeGuide(guide, { includeContact: true }),
    bookings: bookings.map((booking) => serializeBooking(booking)),
    total,
    limit,
    offset,
    stats: {
      pending,
      confirmed,
      upcoming,
      daysBooked: earnings._sum.days ?? 0,
      earnings: Number(earnings._sum.totalCost ?? 0),
    },
  });
});

/** Accept, decline, or close out one assignment. Only the assigned guide may. */
export const respondToAssignment = asyncHandler(async (req: Request, res: Response) => {
  const guide = await getOwnGuideProfile(req.user!.id);
  const bookingId = Number(req.params.id);

  const existing = await prisma.guideBooking.findUnique({ where: { id: bookingId } });
  if (!existing) throw ApiError.notFound('Booking not found');
  if (existing.guideId !== guide.id) throw ApiError.forbidden('That booking is assigned to another guide');

  const { status, guideNote } = req.body;
  assertTransition('guide', existing.status, status);

  const booking = await prisma.guideBooking.update({
    where: { id: bookingId },
    data: { status, ...(guideNote !== undefined ? { guideNote } : {}) },
    include: bookingInclude,
  });

  res.json({ booking: serializeBooking(booking) });
});
