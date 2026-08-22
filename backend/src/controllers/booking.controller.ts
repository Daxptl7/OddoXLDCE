import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  assertGuideIsFree,
  assertTransition,
  bookingDays,
  bookingInclude,
  bookingTotal,
  getGuideOr404,
} from '../services/guide.service.js';
import { serializeBooking } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toDateOnly } from '../utils/dates.js';
import { toNumber } from '../utils/money.js';

/** Hire a guide for a run of days. The guide still has to accept. */
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { guideId, tripId, startDate, endDate, headcount, notes } = req.body;

  const guide = await getGuideOr404(guideId);
  if (!guide.isActive) throw ApiError.badRequest('That guide is not taking bookings right now');
  if (guide.userId === req.user!.id) throw ApiError.badRequest('You cannot book yourself');

  // A trip can be attached, but only one you own — never someone else's.
  if (tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { userId: true } });
    if (!trip) throw ApiError.notFound('Trip not found');
    if (trip.userId !== req.user!.id) throw ApiError.forbidden('That trip belongs to someone else');
  }

  await assertGuideIsFree({ guideId, startDate, endDate, guideName: guide.user.name });

  // Your own overlapping booking would mean two guides for the same day.
  const ownClash = await prisma.guideBooking.findFirst({
    where: {
      touristId: req.user!.id,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startDate: { lte: toDateOnly(endDate) },
      endDate: { gte: toDateOnly(startDate) },
    },
    include: { guide: { include: { user: { select: { name: true } } } } },
  });
  if (ownClash) {
    throw ApiError.conflict(
      `You already have ${ownClash.guide.user.name} booked over those dates — cancel that first`,
    );
  }

  const days = bookingDays(startDate, endDate);
  const dailyRate = toNumber(guide.dailyRate) ?? 0;

  const booking = await prisma.guideBooking.create({
    data: {
      guideId,
      touristId: req.user!.id,
      tripId: tripId ?? null,
      cityId: guide.cityId,
      startDate: toDateOnly(startDate),
      endDate: toDateOnly(endDate),
      days,
      headcount,
      dailyRate,
      totalCost: bookingTotal(dailyRate, days),
      notes: notes ?? null,
    },
    include: bookingInclude,
  });

  res.status(201).json({ booking: serializeBooking(booking) });
});

/** Every guide this traveller has hired. */
export const listMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const { status, scope, limit, offset } = req.validatedQuery as Record<string, unknown>;
  const today = toDateOnly(new Date());

  const where: Prisma.GuideBookingWhereInput = {
    touristId: req.user!.id,
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

  res.json({ bookings: bookings.map((booking) => serializeBooking(booking)), total, limit, offset });
});

export const getMyBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await prisma.guideBooking.findUnique({
    where: { id: Number(req.params.id) },
    include: bookingInclude,
  });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.touristId !== req.user!.id) throw ApiError.forbidden('That booking is not yours');

  res.json({ booking: serializeBooking(booking) });
});

/** Travellers cancel; they never delete. The guide keeps the record either way. */
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.guideBooking.findUnique({ where: { id: Number(req.params.id) } });
  if (!existing) throw ApiError.notFound('Booking not found');
  if (existing.touristId !== req.user!.id) throw ApiError.forbidden('That booking is not yours');

  assertTransition('tourist', existing.status, 'CANCELLED');

  const booking = await prisma.guideBooking.update({
    where: { id: existing.id },
    data: {
      status: 'CANCELLED',
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    },
    include: bookingInclude,
  });

  res.json({ booking: serializeBooking(booking) });
});
