import { formatDateOnly, nightsBetween } from '../utils/dates.js';
import { round2, toNumber } from '../utils/money.js';

export const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  photoUrl: user.photoUrl ?? null,
  createdAt: user.createdAt,
});

export const serializeCity = (city) =>
  city && {
    id: city.id,
    name: city.name,
    country: city.country,
    region: city.region,
    costIndex: city.costIndex,
    popularity: city.popularity,
    imageUrl: city.imageUrl ?? null,
    latitude: city.latitude ?? null,
    longitude: city.longitude ?? null,
  };

export const serializeActivity = (activity) =>
  activity && {
    id: activity.id,
    cityId: activity.cityId,
    name: activity.name,
    description: activity.description ?? null,
    category: activity.category,
    estimatedCost: toNumber(activity.estimatedCost),
    durationMinutes: activity.durationMinutes,
    imageUrl: activity.imageUrl ?? null,
    ...(activity.city ? { city: serializeCity(activity.city) } : {}),
  };

export const serializeStopActivity = (link) => ({
  id: link.id,
  tripStopId: link.tripStopId,
  activityId: link.activityId,
  scheduledDate: formatDateOnly(link.scheduledDate),
  scheduledTime: link.scheduledTime ?? null,
  customCost: toNumber(link.customCost),
  // What this actually costs the trip: the override when set, else the catalogue price.
  cost: toNumber(link.customCost ?? link.activity?.estimatedCost ?? 0),
  activity: link.activity ? serializeActivity(link.activity) : undefined,
});

export const serializeStop = (stop) => {
  const activities = (stop.activities ?? []).map(serializeStopActivity);
  const activityCost = round2(activities.reduce((sum, item) => sum + (item.cost ?? 0), 0));
  const transportCost = toNumber(stop.transportCost) ?? 0;
  const accommodationCost = toNumber(stop.accommodationCost) ?? 0;

  return {
    id: stop.id,
    tripId: stop.tripId,
    cityId: stop.cityId,
    city: stop.city ? serializeCity(stop.city) : undefined,
    arrivalDate: formatDateOnly(stop.arrivalDate),
    departureDate: formatDateOnly(stop.departureDate),
    nights: nightsBetween(stop.arrivalDate, stop.departureDate),
    sortOrder: stop.sortOrder,
    transportCost,
    accommodationCost,
    activityCost,
    stopTotal: round2(transportCost + accommodationCost + activityCost),
    notes: stop.notes ?? null,
    activities,
  };
};

export const serializeTrip = (trip, { includeStops = true } = {}) => {
  const stops = includeStops && trip.stops ? trip.stops.map(serializeStop) : undefined;

  return {
    id: trip.id,
    userId: trip.userId,
    name: trip.name,
    description: trip.description ?? null,
    startDate: formatDateOnly(trip.startDate),
    endDate: formatDateOnly(trip.endDate),
    coverPhotoUrl: trip.coverPhotoUrl ?? null,
    targetBudget: toNumber(trip.targetBudget),
    isPublic: trip.isPublic,
    shareSlug: trip.shareSlug ?? null,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    ...(trip._count ? { stopCount: trip._count.stops } : {}),
    ...(stops ? { stops } : {}),
    ...(trip.user ? { owner: { name: trip.user.name, photoUrl: trip.user.photoUrl ?? null } } : {}),
  };
};
