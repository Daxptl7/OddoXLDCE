import type { Trip } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { daysBetween } from '../utils/dates.js';
import { round2, toNumber } from '../utils/money.js';
import type { BudgetBreakdownRow, BudgetCategoryRow, BudgetHealth, TripBudget } from '../types/index.js';

/**
 * The database showpiece: one query, four tables, produces the whole cost
 * breakdown screen. Nothing in the budget is a stored number the user typed —
 * every figure below is derived at read time.
 */
const BREAKDOWN_SQL = `
  SELECT
    ts.id                AS stop_id,
    c.name               AS city,
    c.country            AS country,
    ts.sort_order        AS sort_order,
    ts.arrival_date      AS arrival_date,
    ts.departure_date    AS departure_date,
    ts.transport_cost    AS transport_cost,
    ts.accommodation_cost AS accommodation_cost,
    COALESCE(SUM(COALESCE(sa.custom_cost, a.estimated_cost)), 0) AS activity_cost,
    COUNT(sa.id)         AS activity_count
  FROM trip_stops ts
  JOIN cities c                ON c.id = ts.city_id
  LEFT JOIN stop_activities sa ON sa.trip_stop_id = ts.id
  LEFT JOIN activities a       ON a.id = sa.activity_id
  WHERE ts.trip_id = $1
  GROUP BY ts.id, c.name, c.country, ts.sort_order,
           ts.arrival_date, ts.departure_date,
           ts.transport_cost, ts.accommodation_cost
  ORDER BY ts.sort_order
`;

/** Same join, grouped by activity category — this is what the pie chart renders. */
const CATEGORY_SQL = `
  SELECT
    a.category                                       AS category,
    COUNT(sa.id)                                     AS count,
    SUM(COALESCE(sa.custom_cost, a.estimated_cost))  AS total
  FROM stop_activities sa
  JOIN trip_stops ts ON ts.id = sa.trip_stop_id
  JOIN activities a  ON a.id = sa.activity_id
  WHERE ts.trip_id = $1
  GROUP BY a.category
  ORDER BY total DESC
`;

export async function getTripBudget(trip: Trip): Promise<TripBudget> {
  const [rows, categoryRows] = await Promise.all([
    prisma.$queryRawUnsafe<BudgetBreakdownRow[]>(BREAKDOWN_SQL, trip.id),
    prisma.$queryRawUnsafe<BudgetCategoryRow[]>(CATEGORY_SQL, trip.id),
  ]);

  const byStop = rows.map((row) => {
    const transport = toNumber(row.transport_cost) ?? 0;
    const accommodation = toNumber(row.accommodation_cost) ?? 0;
    const activities = toNumber(row.activity_cost) ?? 0;
    return {
      stopId: Number(row.stop_id),
      city: row.city,
      country: row.country,
      sortOrder: Number(row.sort_order),
      arrivalDate: row.arrival_date?.toISOString().slice(0, 10) ?? null,
      departureDate: row.departure_date?.toISOString().slice(0, 10) ?? null,
      transport: round2(transport),
      accommodation: round2(accommodation),
      activities: round2(activities),
      activityCount: Number(row.activity_count),
      total: round2(transport + accommodation + activities),
    };
  });

  const totals = byStop.reduce(
    (acc, stop) => ({
      transport: acc.transport + stop.transport,
      accommodation: acc.accommodation + stop.accommodation,
      activities: acc.activities + stop.activities,
    }),
    { transport: 0, accommodation: 0, activities: 0 },
  );

  const grandTotal = round2(totals.transport + totals.accommodation + totals.activities);
  const tripDays = Math.max(1, daysBetween(trip.startDate, trip.endDate) + 1);
  const targetBudget = toNumber(trip.targetBudget);

  return {
    tripId: trip.id,
    currency: 'USD',
    totals: {
      transport: round2(totals.transport),
      accommodation: round2(totals.accommodation),
      activities: round2(totals.activities),
      grandTotal,
    },
    // Ready-to-render pie slices: [{ name, value }]
    breakdown: [
      { name: 'Transport', value: round2(totals.transport) },
      { name: 'Accommodation', value: round2(totals.accommodation) },
      { name: 'Activities', value: round2(totals.activities) },
    ].filter((slice) => slice.value > 0),
    byStop,
    byCategory: categoryRows.map((row) => ({
      category: row.category,
      count: Number(row.count),
      total: round2(toNumber(row.total) ?? 0),
    })),
    perDay: round2(grandTotal / tripDays),
    tripDays,
    target: buildBudgetHealth(grandTotal, targetBudget),
  };
}

/** Budget health bar: green under 75%, amber to 100%, red over. */
function buildBudgetHealth(spent: number, targetBudget: number | null): BudgetHealth {
  if (!targetBudget || targetBudget <= 0) {
    return { budget: null, spent, remaining: null, percentUsed: null, status: 'unset' };
  }
  const percentUsed = round2((spent / targetBudget) * 100);
  const status: BudgetHealth['status'] = percentUsed > 100 ? 'over' : percentUsed >= 75 ? 'warning' : 'healthy';
  return {
    budget: round2(targetBudget),
    spent,
    remaining: round2(targetBudget - spent),
    percentUsed,
    status,
  };
}
