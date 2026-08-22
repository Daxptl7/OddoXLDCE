import type { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { daysBetween, toDateOnly } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

/** Guides are hired by the day, so a Mon→Wed booking is three days, not two. */
export const bookingDays = (start: Date | string, end: Date | string): number =>
  daysBetween(start, end) + 1;

export const bookingTotal = (dailyRate: number, days: number): number => round2(dailyRate * days);

/** Bookings that still hold a guide's calendar. Declined/cancelled ones do not. */
export const BLOCKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED'];

/** One include shape for every booking read, so all three roles get the same JSON. */
export const bookingInclude = {
  guide: { include: { user: true, city: true } },
  tourist: true,
  city: true,
  trip: { select: { id: true, name: true, startDate: true, endDate: true } },
} satisfies Prisma.GuideBookingInclude;

export const guideInclude = {
  user: true,
  city: true,
  _count: { select: { bookings: true } },
} satisfies Prisma.GuideProfileInclude;

/** The signed-in guide's own profile, or a 404 telling them to finish setup. */
export async function getOwnGuideProfile(userId: number) {
  const guide = await prisma.guideProfile.findUnique({ where: { userId }, include: guideInclude });
  if (!guide) throw ApiError.notFound('Your guide profile has not been set up yet');
  return guide;
}

export async function getGuideOr404(guideId: number) {
  const guide = await prisma.guideProfile.findUnique({ where: { id: guideId }, include: guideInclude });
  if (!guide) throw ApiError.notFound('Guide not found');
  return guide;
}

export async function getBookingOr404(bookingId: number) {
  const booking = await prisma.guideBooking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
}

/**
 * Double-booking guard. Day ranges are inclusive on both ends, so two bookings
 * clash whenever one starts on or before the other ends and vice versa.
 * `ignoreBookingId` lets an edit or a reassignment skip the row being moved.
 */
export async function findConflictingBooking(params: {
  guideId: number;
  startDate: Date | string;
  endDate: Date | string;
  ignoreBookingId?: number;
}) {
  const start = toDateOnly(params.startDate);
  const end = toDateOnly(params.endDate);

  return prisma.guideBooking.findFirst({
    where: {
      guideId: params.guideId,
      status: { in: BLOCKING_STATUSES },
      startDate: { lte: end },
      endDate: { gte: start },
      ...(params.ignoreBookingId ? { id: { not: params.ignoreBookingId } } : {}),
    },
    include: { tourist: { select: { name: true } } },
  });
}

/** Throws 409 with the clashing dates spelled out, so the UI needs no lookup. */
export async function assertGuideIsFree(params: {
  guideId: number;
  startDate: Date | string;
  endDate: Date | string;
  ignoreBookingId?: number;
  guideName?: string;
}): Promise<void> {
  const clash = await findConflictingBooking(params);
  if (!clash) return;

  const who = params.guideName ? `${params.guideName} is` : 'That guide is';
  throw ApiError.conflict(
    `${who} already booked from ${clash.startDate.toISOString().slice(0, 10)} to ${clash.endDate
      .toISOString()
      .slice(0, 10)}`,
  );
}

/** Status moves each role is allowed to make. Anything else is a 400. */
const guideTransitions: Record<string, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'DECLINED'],
  CONFIRMED: ['COMPLETED', 'DECLINED'],
};

const touristTransitions: Record<string, BookingStatus[]> = {
  PENDING: ['CANCELLED'],
  CONFIRMED: ['CANCELLED'],
};

export function assertTransition(
  actor: 'guide' | 'tourist',
  from: BookingStatus,
  to: BookingStatus,
): void {
  const allowed = (actor === 'guide' ? guideTransitions : touristTransitions)[from] ?? [];
  if (!allowed.includes(to)) {
    throw ApiError.badRequest(
      `A ${from.toLowerCase()} booking cannot be moved to ${to.toLowerCase()}`,
    );
  }
}
