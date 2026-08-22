import type { Trip, TripStop, StopActivity, Activity, City } from '@prisma/client';
import { eachDate, formatDateOnly } from '../utils/dates.js';
import { round2 } from '../utils/money.js';
import { serializeStop, serializeStopActivity } from './serializers.js';
import type { Itinerary, SerializedStopActivity } from '../types/index.js';

type StopActivityLike = StopActivity & { activity?: Activity };
type StopLike = TripStop & { city?: City; activities?: StopActivityLike[] };
type TripLike = Trip & { stops?: StopLike[] };

interface ItineraryDayBuilder {
  date: string;
  stopId: number | null;
  city: string | null;
  country: string | null;
  activities: (SerializedStopActivity & { unscheduled?: boolean })[];
  dayCost: number;
}

/**
 * Turns a nested trip into a day-by-day plan. The itinerary view and the calendar
 * view both render straight off this, so the two can never disagree.
 */
export function buildItinerary(trip: TripLike): Itinerary {
  const stops = [...(trip.stops ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const days = new Map<string, ItineraryDayBuilder>();

  const ensureDay = (date: string): ItineraryDayBuilder => {
    if (!days.has(date)) {
      days.set(date, { date, stopId: null, city: null, country: null, activities: [], dayCost: 0 });
    }
    return days.get(date)!;
  };

  // Every date the trip itself covers, so gap days still show up on the calendar.
  for (const date of eachDate(trip.startDate, trip.endDate)) ensureDay(date);

  for (const stop of stops) {
    const cityName = stop.city?.name ?? null;
    const country = stop.city?.country ?? null;

    for (const date of eachDate(stop.arrivalDate, stop.departureDate)) {
      const day = ensureDay(date);
      day.stopId = stop.id;
      day.city = cityName;
      day.country = country;
    }

    for (const link of stop.activities ?? []) {
      const serialized = serializeStopActivity(link);
      // An activity with no date yet still belongs somewhere: park it on arrival day.
      const date = serialized.scheduledDate ?? formatDateOnly(stop.arrivalDate)!;
      const day = ensureDay(date);
      if (day.stopId === null) {
        day.stopId = stop.id;
        day.city = cityName;
        day.country = country;
      }
      day.activities.push({ ...serialized, unscheduled: !serialized.scheduledDate });
      day.dayCost = round2(day.dayCost + (serialized.cost ?? 0));
    }
  }

  const sortedDays = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      activities: day.activities.sort((a, b) =>
        (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99'),
      ),
      isEmpty: day.activities.length === 0,
    }));

  return {
    tripId: trip.id,
    startDate: formatDateOnly(trip.startDate)!,
    endDate: formatDateOnly(trip.endDate)!,
    totalDays: sortedDays.length,
    // Grouped by city for the itinerary view...
    stops: stops.map(serializeStop),
    // ...and flat by date for the calendar view.
    days: sortedDays,
  };
}
