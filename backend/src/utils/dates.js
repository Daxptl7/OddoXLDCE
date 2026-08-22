const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" into a UTC-midnight Date, so no timezone can shift the day. */
export function toDateOnly(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formats a Date back to "YYYY-MM-DD". */
export function formatDateOnly(value) {
  if (!value) return null;
  return toDateOnly(value).toISOString().slice(0, 10);
}

export function daysBetween(start, end) {
  return Math.round((toDateOnly(end).getTime() - toDateOnly(start).getTime()) / DAY_MS);
}

/** Inclusive night count is exclusive day count; a 1st→5th stay is 4 nights, 5 days. */
export function nightsBetween(start, end) {
  return Math.max(0, daysBetween(start, end));
}

/** Every date from start to end inclusive, as "YYYY-MM-DD" strings. */
export function eachDate(start, end) {
  const days = [];
  const cursor = toDateOnly(start);
  const last = toDateOnly(end);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** True when [aStart, aEnd] and [bStart, bEnd] share more than a handover day. */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return toDateOnly(aStart) < toDateOnly(bEnd) && toDateOnly(bStart) < toDateOnly(aEnd);
}

export function addDays(value, days) {
  const date = toDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}
