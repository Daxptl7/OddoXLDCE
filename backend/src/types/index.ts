import type { Prisma } from '@prisma/client';

// ── Raw SQL row types for budget.service ─────────────────────────────

export interface BudgetBreakdownRow {
  stop_id: bigint;
  city: string;
  country: string;
  sort_order: bigint;
  arrival_date: Date | null;
  departure_date: Date | null;
  transport_cost: Prisma.Decimal | number;
  accommodation_cost: Prisma.Decimal | number;
  activity_cost: Prisma.Decimal | number;
  activity_count: bigint;
}

export interface BudgetCategoryRow {
  category: string;
  count: bigint;
  total: Prisma.Decimal | number;
}

// ── Budget return shape ──────────────────────────────────────────────

export interface BudgetStopBreakdown {
  stopId: number;
  city: string;
  country: string;
  sortOrder: number;
  arrivalDate: string | null;
  departureDate: string | null;
  transport: number;
  accommodation: number;
  activities: number;
  activityCount: number;
  total: number;
}

export interface BudgetHealth {
  budget: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: 'unset' | 'healthy' | 'warning' | 'over';
}

export interface TripBudget {
  tripId: number;
  currency: string;
  totals: {
    transport: number;
    accommodation: number;
    activities: number;
    grandTotal: number;
  };
  breakdown: Array<{ name: string; value: number }>;
  byStop: BudgetStopBreakdown[];
  byCategory: Array<{ category: string; count: number; total: number }>;
  perDay: number;
  tripDays: number;
  target: BudgetHealth;
}

// ── Trip warnings ────────────────────────────────────────────────────

export interface TripWarning {
  type: 'outside_trip_dates' | 'overlapping_stops' | 'empty_stop' | 'bad_weather';
  stopId: number;
  message: string;
  severity?: 'warning' | 'critical' | 'info';
}

// ── Weather Types ───────────────────────────────────────────────────

export interface WeatherDaily {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  weatherCode: number;
  icon: string;
  precipitationProb: number;
  precipitationMm: number;
  windSpeedKm: number;
  isAdverse: boolean;
  adverseReason: string | null;
}

export interface WeatherForecast {
  cityId?: number;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  source: 'google' | 'open-meteo' | 'fallback';
  hasAdverseWeather: boolean;
  adverseSummary: string | null;
  days: WeatherDaily[];
}

// ── Hotel Types (Overpass OSM) ──────────────────────────────────────

export interface Hotel {
  id: string;
  name: string;
  stars: number | null;
  address: string;
  street: string | null;
  city: string;
  postcode: string | null;
  country: string;
  latitude: number;
  longitude: number;
  website: string | null;
  phone: string | null;
  email: string | null;
  amenities: string[];
  estimatedPricePerNight: number;
  distanceKm: number;
  rooms?: number | null;
  wheelchair?: boolean | null;
}

// ── Food Suggestion Types ───────────────────────────────────────────

export interface FoodEatery {
  name: string;
  type: string;
  approxDistance?: string;
  description: string;
  priceLevel?: string;
}

export interface FoodItem {
  dish: string;
  localName: string;
  description: string;
  category: 'must_try' | 'street_food' | 'sweet_dessert' | 'beverage' | 'classic';
  estimatedCost: number;
  whySpecial: string;
  foodieTip: string;
  bestPlacesNearHotel: FoodEatery[];
}

export interface FoodSuggestionsResult {
  cityName: string;
  country: string;
  hotelName: string | null;
  cuisineOverview: string;
  source: 'groq' | 'fallback';
  foods: FoodItem[];
}

// ── Itinerary ────────────────────────────────────────────────────────

export interface ItineraryActivity {
  id: number;
  tripStopId: number;
  activityId: number;
  scheduledDate: string | null;
  scheduledTime: string | null;
  customCost: number | null;
  cost: number;
  activity?: SerializedActivity;
  unscheduled?: boolean;
}

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  stopId: number | null;
  city: string | null;
  country: string | null;
  activities: ItineraryActivity[];
  dayCost: number;
  isEmpty: boolean;
}

export interface Itinerary {
  tripId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  stops: SerializedStop[];
  days: ItineraryDay[];
}

// ── Serialized shapes ────────────────────────────────────────────────

export interface SerializedUser {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
  createdAt: Date;
}

export interface SerializedCity {
  id: number;
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SerializedActivity {
  id: number;
  cityId: number;
  name: string;
  description: string | null;
  category: string;
  estimatedCost: number | null;
  durationMinutes: number;
  imageUrl: string | null;
  city?: SerializedCity;
}

export interface SerializedStopActivity {
  id: number;
  tripStopId: number;
  activityId: number;
  scheduledDate: string | null;
  scheduledTime: string | null;
  customCost: number | null;
  cost: number;
  activity?: SerializedActivity;
}

export interface SerializedStop {
  id: number;
  tripId: number;
  cityId: number;
  city?: SerializedCity;
  arrivalDate: string | null;
  departureDate: string | null;
  nights: number;
  sortOrder: number;
  transportCost: number;
  accommodationCost: number;
  activityCost: number;
  stopTotal: number;
  notes: string | null;
  activities: SerializedStopActivity[];
}

export interface SerializedTrip {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coverPhotoUrl: string | null;
  targetBudget: number | null;
  isPublic: boolean;
  shareSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
  stopCount?: number;
  stops?: SerializedStop[];
  owner?: { name: string; photoUrl: string | null };
}
