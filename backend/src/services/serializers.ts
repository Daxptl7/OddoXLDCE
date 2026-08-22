import type {
  User,
  City,
  Activity,
  TripStop,
  StopActivity,
  Trip,
  GuideProfile,
  GuideBooking,
} from '@prisma/client';
import { formatDateOnly, nightsBetween } from '../utils/dates.js';
import { round2, toNumber } from '../utils/money.js';
import type {
  SerializedUser,
  SerializedCity,
  SerializedActivity,
  SerializedStopActivity,
  SerializedStop,
  SerializedTrip,
  SerializedGuide,
  SerializedBooking,
} from '../types/index.js';

type UserLike = Pick<User, 'id' | 'name' | 'email' | 'photoUrl' | 'createdAt'> &
  Partial<Pick<User, 'phone' | 'role'>>;

export const serializeUser = (user: UserLike): SerializedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  photoUrl: user.photoUrl ?? null,
  phone: user.phone ?? null,
  role: user.role ?? 'USER',
  createdAt: user.createdAt,
});

type CityLike = Pick<City, 'id' | 'name' | 'country' | 'region' | 'costIndex' | 'popularity' | 'imageUrl' | 'latitude' | 'longitude'>;

export const serializeCity = (city: CityLike): SerializedCity =>
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

type ActivityLike = Activity & { city?: CityLike };

export const serializeActivity = (activity: ActivityLike): SerializedActivity =>
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

type StopActivityLike = StopActivity & { activity?: ActivityLike };

export const serializeStopActivity = (link: StopActivityLike): SerializedStopActivity => ({
  id: link.id,
  tripStopId: link.tripStopId,
  activityId: link.activityId,
  scheduledDate: formatDateOnly(link.scheduledDate),
  scheduledTime: link.scheduledTime ?? null,
  customCost: toNumber(link.customCost),
  // What this actually costs the trip: the override when set, else the catalogue price.
  cost: toNumber(link.customCost ?? link.activity?.estimatedCost ?? 0) ?? 0,
  activity: link.activity ? serializeActivity(link.activity) : undefined,
});

type StopLike = TripStop & { city?: CityLike; activities?: StopActivityLike[] };

export const serializeStop = (stop: StopLike): SerializedStop => {
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

type TripLike = Trip & {
  stops?: StopLike[];
  _count?: { stops: number };
  user?: { name: string; photoUrl: string | null };
};

export const serializeTrip = (trip: TripLike, { includeStops = true } = {}): SerializedTrip => {
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

// ── Guides & bookings ────────────────────────────────────────────────

type GuideLike = GuideProfile & {
  user?: Pick<User, 'id' | 'name' | 'email' | 'photoUrl' | 'phone'>;
  city?: CityLike;
  _count?: { bookings: number };
};

/**
 * Contact details are opt-in. A traveller browsing the directory sees the
 * profile; the phone and email only appear once a booking is confirmed (or to
 * the guide themselves and to admins), so the marketplace can't be scraped.
 */
export const serializeGuide = (
  guide: GuideLike,
  { includeContact = false } = {},
): SerializedGuide => ({
  id: guide.id,
  userId: guide.userId,
  name: guide.user?.name ?? 'Guide',
  email: includeContact ? guide.user?.email ?? null : null,
  phone: includeContact ? guide.user?.phone ?? null : null,
  photoUrl: guide.user?.photoUrl ?? null,
  headline: guide.headline ?? null,
  bio: guide.bio ?? null,
  languages: guide.languages ?? [],
  specialties: guide.specialties ?? [],
  dailyRate: toNumber(guide.dailyRate) ?? 0,
  experienceYears: guide.experienceYears,
  rating: guide.rating,
  isActive: guide.isActive,
  isVerified: guide.isVerified,
  cityId: guide.cityId,
  ...(guide.city ? { city: serializeCity(guide.city) } : {}),
  ...(guide._count ? { tripsGuided: guide._count.bookings } : {}),
  createdAt: guide.createdAt,
});

type BookingLike = GuideBooking & {
  guide?: GuideLike;
  tourist?: Pick<User, 'id' | 'name' | 'email' | 'photoUrl' | 'phone'>;
  trip?: Pick<Trip, 'id' | 'name' | 'startDate' | 'endDate'> | null;
  city?: CityLike;
};

/** Confirmed (or finished) work is what unlocks both sides' contact details. */
export const contactUnlocked = (status: GuideBooking['status']): boolean =>
  status === 'CONFIRMED' || status === 'COMPLETED';

export const serializeBooking = (
  booking: BookingLike,
  { forceContact = false } = {},
): SerializedBooking => {
  const showContact = forceContact || contactUnlocked(booking.status);

  return {
    id: booking.id,
    guideId: booking.guideId,
    touristId: booking.touristId,
    tripId: booking.tripId ?? null,
    cityId: booking.cityId,
    startDate: formatDateOnly(booking.startDate),
    endDate: formatDateOnly(booking.endDate),
    days: booking.days,
    headcount: booking.headcount,
    dailyRate: toNumber(booking.dailyRate) ?? 0,
    totalCost: toNumber(booking.totalCost) ?? 0,
    status: booking.status,
    notes: booking.notes ?? null,
    guideNote: booking.guideNote ?? null,
    adminNote: booking.adminNote ?? null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    ...(booking.guide ? { guide: serializeGuide(booking.guide, { includeContact: showContact }) } : {}),
    ...(booking.tourist
      ? {
          tourist: {
            id: booking.tourist.id,
            name: booking.tourist.name,
            email: showContact ? booking.tourist.email : null,
            phone: showContact ? booking.tourist.phone ?? null : null,
            photoUrl: booking.tourist.photoUrl ?? null,
          },
        }
      : {}),
    ...(booking.trip !== undefined
      ? {
          trip: booking.trip
            ? {
                id: booking.trip.id,
                name: booking.trip.name,
                startDate: formatDateOnly(booking.trip.startDate),
                endDate: formatDateOnly(booking.trip.endDate),
              }
            : null,
        }
      : {}),
    ...(booking.city ? { city: serializeCity(booking.city) } : {}),
  };
};
