import { prisma } from '../lib/prisma.js';
import { serializeActivity, serializeCity } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const citySort = {
  popularity: [{ popularity: 'desc' }, { name: 'asc' }],
  name: [{ name: 'asc' }],
  cost: [{ costIndex: 'asc' }, { popularity: 'desc' }],
};

const activitySort = {
  cost: [{ estimatedCost: 'asc' }, { name: 'asc' }],
  name: [{ name: 'asc' }],
  duration: [{ durationMinutes: 'asc' }, { name: 'asc' }],
};

export const searchCities = asyncHandler(async (req, res) => {
  const { q, country, region, maxCostIndex, sort, limit, offset } = req.validatedQuery;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { country: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(country ? { country: { equals: country, mode: 'insensitive' } } : {}),
    ...(region ? { region: { equals: region, mode: 'insensitive' } } : {}),
    ...(maxCostIndex ? { costIndex: { lte: maxCostIndex } } : {}),
  };

  const [cities, total] = await Promise.all([
    prisma.city.findMany({ where, orderBy: citySort[sort], take: limit, skip: offset }),
    prisma.city.count({ where }),
  ]);

  res.json({ cities: cities.map(serializeCity), total, limit, offset });
});

export const getCity = asyncHandler(async (req, res) => {
  const city = await prisma.city.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { activities: true } } },
  });
  if (!city) throw ApiError.notFound('City not found');

  res.json({ city: { ...serializeCity(city), activityCount: city._count.activities } });
});

export const listCityActivities = asyncHandler(async (req, res) => {
  const { q, category, maxCost, maxDuration, sort, limit, offset } = req.validatedQuery;

  const city = await prisma.city.findUnique({ where: { id: req.params.id } });
  if (!city) throw ApiError.notFound('City not found');

  const where = {
    cityId: city.id,
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
    ...(maxCost !== undefined ? { estimatedCost: { lte: maxCost } } : {}),
    ...(maxDuration !== undefined ? { durationMinutes: { lte: maxDuration } } : {}),
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({ where, orderBy: activitySort[sort], take: limit, skip: offset }),
    prisma.activity.count({ where }),
  ]);

  res.json({ city: serializeCity(city), activities: activities.map(serializeActivity), total });
});

/** Cross-city activity search, for the standalone "Activity Search" screen. */
export const searchActivities = asyncHandler(async (req, res) => {
  const { q, category, maxCost, maxDuration, sort, limit, offset } = req.validatedQuery;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
    ...(maxCost !== undefined ? { estimatedCost: { lte: maxCost } } : {}),
    ...(maxDuration !== undefined ? { durationMinutes: { lte: maxDuration } } : {}),
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: activitySort[sort],
      take: limit,
      skip: offset,
      include: { city: true },
    }),
    prisma.activity.count({ where }),
  ]);

  res.json({ activities: activities.map(serializeActivity), total, limit, offset });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await prisma.activity.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });
  res.json({ categories: rows.map((row) => ({ category: row.category, count: row._count.category })) });
});
