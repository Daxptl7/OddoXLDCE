import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeActivity, serializeCity } from '../services/serializers.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const citySort: Record<string, Array<Record<string, string>>> = {
  popularity: [{ popularity: 'desc' }, { name: 'asc' }],
  name: [{ name: 'asc' }],
  cost: [{ costIndex: 'asc' }, { popularity: 'desc' }],
};

const activitySort: Record<string, Array<Record<string, string>>> = {
  cost: [{ estimatedCost: 'asc' }, { name: 'asc' }],
  name: [{ name: 'asc' }],
  duration: [{ durationMinutes: 'asc' }, { name: 'asc' }],
};

export const searchCities = asyncHandler(async (req: Request, res: Response) => {
  const { q, country, region, maxCostIndex, sort, limit, offset } = req.validatedQuery as Record<string, unknown>;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' as const } },
            { country: { contains: q as string, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(country ? { country: { equals: country as string, mode: 'insensitive' as const } } : {}),
    ...(region ? { region: { equals: region as string, mode: 'insensitive' as const } } : {}),
    ...(maxCostIndex ? { costIndex: { lte: maxCostIndex as number } } : {}),
  };

  const [cities, total] = await Promise.all([
    prisma.city.findMany({ where, orderBy: citySort[sort as string], take: limit as number, skip: offset as number }),
    prisma.city.count({ where }),
  ]);

  res.json({ cities: cities.map(serializeCity), total, limit, offset });
});

export const getCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await prisma.city.findUnique({
    where: { id: Number(req.params.id) },
    include: { _count: { select: { activities: true } } },
  });
  if (!city) throw ApiError.notFound('City not found');

  res.json({ city: { ...serializeCity(city), activityCount: city._count.activities } });
});

export const listCityActivities = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, maxCost, maxDuration, sort, limit, offset } = req.validatedQuery as Record<string, unknown>;

  const city = await prisma.city.findUnique({ where: { id: Number(req.params.id) } });
  if (!city) throw ApiError.notFound('City not found');

  const where = {
    cityId: city.id,
    ...(q ? { name: { contains: q as string, mode: 'insensitive' as const } } : {}),
    ...(category ? { category: { equals: category as string, mode: 'insensitive' as const } } : {}),
    ...(maxCost !== undefined ? { estimatedCost: { lte: maxCost as number } } : {}),
    ...(maxDuration !== undefined ? { durationMinutes: { lte: maxDuration as number } } : {}),
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({ where, orderBy: activitySort[sort as string], take: limit as number, skip: offset as number }),
    prisma.activity.count({ where }),
  ]);

  res.json({ city: serializeCity(city), activities: activities.map(serializeActivity), total });
});

/** Cross-city activity search, for the standalone "Activity Search" screen. */
export const searchActivities = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, maxCost, maxDuration, sort, limit, offset } = req.validatedQuery as Record<string, unknown>;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' as const } },
            { city: { name: { contains: q as string, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
    ...(category ? { category: { equals: category as string, mode: 'insensitive' as const } } : {}),
    ...(maxCost !== undefined ? { estimatedCost: { lte: maxCost as number } } : {}),
    ...(maxDuration !== undefined ? { durationMinutes: { lte: maxDuration as number } } : {}),
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: activitySort[sort as string],
      take: limit as number,
      skip: offset as number,
      include: { city: true },
    }),
    prisma.activity.count({ where }),
  ]);

  res.json({ activities: activities.map(serializeActivity), total, limit, offset });
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await prisma.activity.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });
  res.json({ categories: rows.map((row) => ({ category: row.category, count: row._count.category })) });
});
