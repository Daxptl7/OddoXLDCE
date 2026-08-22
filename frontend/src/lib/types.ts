// Typed straight off backend/src/types/index.ts and services/serializers.ts —
// these shapes are the wire contract, not a guess.

export interface SerializedUser {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
  createdAt: string;
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
  activityCount?: number;
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
  /** What this actually costs the trip: customCost override, else the catalogue price. */
  cost: number;
  activity?: SerializedActivity;
  unscheduled?: boolean;
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
  userId?: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  coverPhotoUrl: string | null;
  targetBudget: number | null;
  isPublic: boolean;
  shareSlug?: string | null;
  createdAt: string;
  updatedAt: string;
  stopCount?: number;
  stops?: SerializedStop[];
  owner?: { name: string; photoUrl: string | null };
}

export interface TripWarning {
  type: "outside_trip_dates" | "overlapping_stops" | "empty_stop";
  stopId: number;
  message: string;
}

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  stopId: number | null;
  city: string | null;
  country: string | null;
  activities: SerializedStopActivity[];
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
  status: "unset" | "healthy" | "warning" | "over";
}

export interface TripBudget {
  tripId: number;
  currency: string;
  totals: { transport: number; accommodation: number; activities: number; grandTotal: number };
  breakdown: Array<{ name: string; value: number }>;
  byStop: BudgetStopBreakdown[];
  byCategory: Array<{ category: string; count: number; total: number }>;
  perDay: number;
  tripDays: number;
  target: BudgetHealth;
}

// ── Request / response envelopes ────────────────────────────────────

export interface AuthResponse {
  user: SerializedUser;
  token: string;
}

export interface DashboardResponse {
  user: { name: string; photoUrl: string | null };
  stats: { tripCount: number; upcomingCount: number };
  recentTrips: SerializedTrip[];
  upcomingTrips: SerializedTrip[];
  recommendedCities: SerializedCity[];
}

export interface TripListResponse {
  trips: SerializedTrip[];
  total: number;
  limit: number;
  offset: number;
}

export interface TripDeepResponse {
  trip: SerializedTrip;
  warnings: TripWarning[];
  shareUrl: string | null;
}

export interface ShareResponse {
  shareSlug: string;
  shareUrl: string;
  isPublic: boolean;
}

export interface CityListResponse {
  cities: SerializedCity[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActivityListResponse {
  activities: SerializedActivity[];
  total: number;
  limit: number;
  offset: number;
}

export interface PublicTripResponse {
  trip: SerializedTrip;
  itinerary: Itinerary;
  budget: TripBudget;
  readOnly: true;
}

export interface AiPlanStop {
  city: SerializedCity;
  suggestedDays: number;
  estimatedCost: number;
  activities: SerializedActivity[];
  reason?: string;
}

export interface AiPlanResponse {
  source: "groq" | "seeded-fallback";
  fallbackReason?: {
    code: "missing_groq_key" | "groq_http_error" | "groq_empty_response" | "groq_invalid_json" | "groq_invalid_plan";
    message: string;
  };
  title: string;
  summary: string;
  targetBudget: number | null;
  interests: string[];
  stops: AiPlanStop[];
  estimatedTotal: number;
}

export interface AiRecommendationGroup {
  stopId: number;
  city: string;
  reason: string;
  activities: SerializedActivity[];
}

export interface AiRecommendResponse {
  source: "groq" | "seeded-fallback";
  recommendations: AiRecommendationGroup[];
}

export interface AiOptimizeAction {
  stopActivityId: number;
  label: string;
  savings: number;
  reason: string;
}

export interface AiOptimizeResponse {
  source: "groq" | "seeded-fallback";
  currentTotal: number;
  targetBudget: number;
  neededSavings: number;
  status: "already_under_target" | "actionable" | "partial";
  actions: AiOptimizeAction[];
  expectedSavings: number;
  reason: string;
}

export type TripScope = "all" | "upcoming" | "past";
export type CatalogueSort = "popularity" | "name" | "cost" | "duration";

export interface CreateTripInput {
  name: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  coverPhotoUrl?: string | null;
  targetBudget?: number | null;
}

export type UpdateTripInput = Partial<CreateTripInput> & { isPublic?: boolean };

export interface CreateStopInput {
  cityId: number;
  arrivalDate: string;
  departureDate: string;
  transportCost?: number;
  accommodationCost?: number;
  notes?: string | null;
}

export type UpdateStopInput = Partial<CreateStopInput>;

export interface AddStopActivityInput {
  activityId: number;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  customCost?: number | null;
}

export type UpdateStopActivityInput = Partial<Omit<AddStopActivityInput, "activityId">>;

export interface AiPlanInput {
  destinations: string;
  durationDays?: number;
  budget?: number;
  interests?: string[];
  travelStyle?: string;
}
