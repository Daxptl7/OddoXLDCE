import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { fetchWeatherForecast } from '../services/weather.service.js';
import { getOwnedTrip } from '../services/trip.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatDateOnly, toDateOnly, addDays } from '../utils/dates.js';

export const getCityWeather = asyncHandler(async (req: Request, res: Response) => {
  const cityId = Number(req.params.cityId);
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw ApiError.notFound('City not found');

  const now = new Date();
  const startDate = req.query.startDate ? String(req.query.startDate) : (formatDateOnly(now) ?? now.toISOString().slice(0, 10));
  const endDate = req.query.endDate ? String(req.query.endDate) : (formatDateOnly(addDays(now, 5)) ?? addDays(now, 5).toISOString().slice(0, 10));

  const forecast = await fetchWeatherForecast(city, startDate, endDate);
  res.json({ forecast });
});

export const getTripWeather = asyncHandler(async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized();

  const trip = await getOwnedTrip(tripId, userId, { deep: true });
  const stops = (trip as any).stops ?? [];

  const stopForecasts = await Promise.all(
    stops.map(async (stop: any) => {
      const city = stop.city;
      if (!city) return null;
      const forecast = await fetchWeatherForecast(city, stop.arrivalDate, stop.departureDate);
      return {
        stopId: stop.id,
        cityId: city.id,
        cityName: city.name,
        country: city.country,
        arrivalDate: formatDateOnly(stop.arrivalDate),
        departureDate: formatDateOnly(stop.departureDate),
        forecast,
      };
    }),
  );

  const filtered = stopForecasts.filter(Boolean);
  const adverseStops = filtered.filter((s: any) => s.forecast.hasAdverseWeather);

  res.json({
    tripId,
    hasAdverseWeather: adverseStops.length > 0,
    stopForecasts: filtered,
  });
});
