import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  bookingDays,
  bookingInclude,
  bookingTotal,
  findConflictingBooking,
  getBookingOr404,
  guideInclude,
} from '../services/guide.service.js';
import { serializeBooking, serializeGuide, serializeUser } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toDateOnly } from '../utils/dates.js';
import { toNumber } from '../utils/money.js';

/** The console's headline numbers. */
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const today = toDateOnly(new Date());

  const [users, guides, admins, activeGuides, trips, bookingsByStatus, upcoming, revenue] =
    await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'GUIDE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.guideProfile.count({ where: { isActive: true } }),
      prisma.trip.count(),
      prisma.guideBooking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.guideBooking.count({ where: { status: 'CONFIRMED', startDate: { gte: today } } }),
      prisma.guideBooking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalCost: true },
      }),
    ]);

  const byStatus = Object.fromEntries(
    bookingsByStatus.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  res.json({
    stats: {
      travellers: users,
      guides,
      admins,
      activeGuides,
      trips,
      bookings: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
      pendingBookings: byStatus.PENDING ?? 0,
      confirmedBookings: byStatus.CONFIRMED ?? 0,
      upcomingBookings: upcoming,
      bookingRevenue: Number(revenue._sum.totalCost ?? 0),
      byStatus,
    },
  });
});

// ── Users ────────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, role, limit, offset } = req.validatedQuery as Record<string, unknown>;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as never } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' as const } },
            { email: { contains: q as string, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { id: 'asc' },
      take: limit as number,
      skip: offset as number,
      include: {
        guideProfile: { include: guideInclude },
        _count: { select: { trips: true, bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users: users.map((user) => ({
      ...serializeUser(user),
      tripCount: user._count.trips,
      bookingCount: user._count.bookings,
      guide: user.guideProfile ? serializeGuide(user.guideProfile, { includeContact: true }) : null,
    })),
    total,
    limit,
    offset,
  });
});

/**
 * Role changes are the sharpest tool here, so the guardrails matter: an admin
 * cannot demote themselves (that could lock everyone out of this console), and
 * promoting someone to GUIDE mints the profile the guide pages need.
 */
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { role, cityId, dailyRate } = req.body;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { guideProfile: true },
  });
  if (!target) throw ApiError.notFound('User not found');

  if (target.id === req.user!.id && role !== 'ADMIN') {
    throw ApiError.badRequest('You cannot remove your own admin access');
  }

  if (role === 'GUIDE' && !target.guideProfile) {
    if (!cityId) throw ApiError.badRequest('Pick the city this guide will cover');
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw ApiError.badRequest('That city is not in our catalogue yet');

    await prisma.guideProfile.create({
      data: {
        userId: target.id,
        cityId,
        dailyRate: dailyRate ?? 3000,
        isVerified: true,
      },
    });
  }

  // Losing the guide role parks the profile instead of deleting its history.
  if (role !== 'GUIDE' && target.guideProfile) {
    await prisma.guideProfile.update({
      where: { id: target.guideProfile.id },
      data: { isActive: false },
    });
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: { role },
    include: { guideProfile: { include: guideInclude } },
  });

  res.json({
    user: {
      ...serializeUser(user),
      guide: user.guideProfile ? serializeGuide(user.guideProfile, { includeContact: true }) : null,
    },
  });
});

// ── Guides ───────────────────────────────────────────────────────────

export const listGuides = asyncHandler(async (req: Request, res: Response) => {
  const { q, cityId, status, limit, offset } = req.validatedQuery as Record<string, unknown>;

  const where: Prisma.GuideProfileWhereInput = {
    ...(cityId ? { cityId: cityId as number } : {}),
    ...(status === 'active' ? { isActive: true } : {}),
    ...(status === 'inactive' ? { isActive: false } : {}),
    ...(status === 'unverified' ? { isVerified: false } : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q as string, mode: 'insensitive' as const } } },
            { user: { email: { contains: q as string, mode: 'insensitive' as const } } },
            { city: { name: { contains: q as string, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [guides, total] = await Promise.all([
    prisma.guideProfile.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { rating: 'desc' }],
      take: limit as number,
      skip: offset as number,
      include: guideInclude,
    }),
    prisma.guideProfile.count({ where }),
  ]);

  res.json({
    guides: guides.map((guide) => serializeGuide(guide, { includeContact: true })),
    total,
    limit,
    offset,
  });
});

export const updateGuide = asyncHandler(async (req: Request, res: Response) => {
  const guideId = Number(req.params.id);
  const existing = await prisma.guideProfile.findUnique({ where: { id: guideId } });
  if (!existing) throw ApiError.notFound('Guide not found');

  if (req.body.cityId && req.body.cityId !== existing.cityId) {
    const city = await prisma.city.findUnique({ where: { id: req.body.cityId } });
    if (!city) throw ApiError.badRequest('That city is not in our catalogue yet');
  }

  const guide = await prisma.guideProfile.update({
    where: { id: guideId },
    data: req.body,
    include: guideInclude,
  });

  res.json({ guide: serializeGuide(guide, { includeContact: true }) });
});

// ── Bookings ─────────────────────────────────────────────────────────

export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const { q, status, guideId, cityId, limit, offset } = req.validatedQuery as Record<string, unknown>;

  const where: Prisma.GuideBookingWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(guideId ? { guideId: guideId as number } : {}),
    ...(cityId ? { cityId: cityId as number } : {}),
    ...(q
      ? {
          OR: [
            { tourist: { name: { contains: q as string, mode: 'insensitive' as const } } },
            { tourist: { email: { contains: q as string, mode: 'insensitive' as const } } },
            { guide: { user: { name: { contains: q as string, mode: 'insensitive' as const } } } },
            { city: { name: { contains: q as string, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.guideBooking.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      take: limit as number,
      skip: offset as number,
      include: bookingInclude,
    }),
    prisma.guideBooking.count({ where }),
  ]);

  res.json({
    // Admins see contact details regardless of status — this is the support desk.
    bookings: bookings.map((booking) => serializeBooking(booking, { forceContact: true })),
    total,
    limit,
    offset,
  });
});

/**
 * The reassignment endpoint: move a booking to a different guide, shift its
 * dates, or override its status. Reassigning re-prices against the new guide's
 * rate and re-checks their calendar unless the admin explicitly forces it.
 */
export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  const existing = await getBookingOr404(Number(req.params.id));
  const { guideId, status, startDate, endDate, headcount, adminNote, force } = req.body;

  const nextGuideId = guideId ?? existing.guideId;
  const nextStart = startDate ? toDateOnly(startDate) : existing.startDate;
  const nextEnd = endDate ? toDateOnly(endDate) : existing.endDate;
  if (nextEnd < nextStart) throw ApiError.badRequest('The last day cannot be before the first day');

  const nextGuide =
    nextGuideId === existing.guideId
      ? existing.guide
      : await prisma.guideProfile.findUnique({
          where: { id: nextGuideId },
          include: { user: true, city: true },
        });
  if (!nextGuide) throw ApiError.notFound('The guide you picked no longer exists');

  if (nextGuide.userId === existing.touristId) {
    throw ApiError.badRequest('A guide cannot be assigned to their own booking');
  }

  const nextStatus = status ?? existing.status;
  const stillBlocks = ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(nextStatus);
  const datesOrGuideMoved =
    nextGuideId !== existing.guideId ||
    nextStart.getTime() !== existing.startDate.getTime() ||
    nextEnd.getTime() !== existing.endDate.getTime();

  if (!force && stillBlocks && datesOrGuideMoved) {
    const clash = await findConflictingBooking({
      guideId: nextGuideId,
      startDate: nextStart,
      endDate: nextEnd,
      ignoreBookingId: existing.id,
    });
    if (clash) {
      throw ApiError.conflict(
        `${nextGuide.user.name} is already booked ${clash.startDate
          .toISOString()
          .slice(0, 10)} → ${clash.endDate.toISOString().slice(0, 10)} (booking #${clash.id}). ` +
          'Pick another guide, move the dates, or resend with force to override.',
      );
    }
  }

  // A new guide means a new rate; keep the old price when only dates change.
  const dailyRate =
    nextGuideId === existing.guideId
      ? toNumber(existing.dailyRate) ?? 0
      : toNumber(nextGuide.dailyRate) ?? 0;
  const days = bookingDays(nextStart, nextEnd);

  const booking = await prisma.guideBooking.update({
    where: { id: existing.id },
    data: {
      guideId: nextGuideId,
      cityId: nextGuide.cityId,
      startDate: nextStart,
      endDate: nextEnd,
      days,
      dailyRate,
      totalCost: bookingTotal(dailyRate, days),
      status: nextStatus,
      ...(headcount !== undefined ? { headcount } : {}),
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
    include: bookingInclude,
  });

  res.json({ booking: serializeBooking(booking, { forceContact: true }) });
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.guideBooking.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Booking not found');

  await prisma.guideBooking.delete({ where: { id } });
  res.json({ ok: true, deletedId: id });
});
