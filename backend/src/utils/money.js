import { Prisma } from '@prisma/client';

/** Prisma Decimal -> plain number, so JSON responses carry numbers not objects. */
export function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Prisma.Decimal) return value.toNumber();
  return Number(value);
}

/** Rounds to 2dp and avoids -0 / floating point dust in totals. */
export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
