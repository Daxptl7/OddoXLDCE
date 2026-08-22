import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { fetchHotelsFromOverpass } from '../services/hotel.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listHotels = asyncHandler(async (req: Request, res: Response) => {
  const cityId = req.query.cityId ? Number(req.query.cityId) : null;
  let cityName = req.query.cityName ? String(req.query.cityName) : '';
  let country = req.query.country ? String(req.query.country) : '';
  let lat = req.query.lat ? Number(req.query.lat) : 0;
  let lng = req.query.lng ? Number(req.query.lng) : 0;
  let costIndex = 3;

  if (cityId) {
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw ApiError.notFound('City not found');
    cityName = city.name;
    country = city.country;
    lat = city.latitude ?? 48.8566;
    lng = city.longitude ?? 2.3522;
    costIndex = city.costIndex;
  } else if (!cityName) {
    throw ApiError.badRequest('cityId or cityName is required');
  }

  const radius = req.query.radius ? Number(req.query.radius) : 8000;
  let hotels = await fetchHotelsFromOverpass(cityName, country, lat, lng, costIndex, radius);

  // Search filter
  const search = req.query.q ? String(req.query.q).toLowerCase().trim() : null;
  if (search) {
    hotels = hotels.filter(
      (h) =>
        h.name.toLowerCase().includes(search) ||
        h.address.toLowerCase().includes(search) ||
        h.amenities.some((a) => a.toLowerCase().includes(search)),
    );
  }

  // Star filter
  const minStars = req.query.stars ? Number(req.query.stars) : null;
  if (minStars) {
    hotels = hotels.filter((h) => (h.stars ?? 0) >= minStars);
  }

  // Max price filter
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  if (maxPrice) {
    hotels = hotels.filter((h) => h.estimatedPricePerNight <= maxPrice);
  }

  // Limit
  const limit = req.query.limit ? Number(req.query.limit) : 25;
  const paginated = hotels.slice(0, limit);

  res.json({
    cityName,
    country,
    total: hotels.length,
    hotels: paginated,
  });
});
