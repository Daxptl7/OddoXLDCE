// Typed straight off backend/src/types/index.ts and services/serializers.ts —
// these shapes are the wire contract, not a guess.

export type UserRole = "USER" | "GUIDE" | "ADMIN";

export interface SerializedUser {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
  phone: string | null;
  role: UserRole;
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
  type: "outside_trip_dates" | "overlapping_stops" | "empty_stop" | "bad_weather";
  stopId: number;
  message: string;
  severity?: "warning" | "critical" | "info";
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
  user: { name: string; photoUrl: string | null; role: UserRole };
  stats: { tripCount: number; upcomingCount: number; guideCount: number };
  recentTrips: SerializedTrip[];
  upcomingTrips: SerializedTrip[];
  recommendedCities: SerializedCity[];
  guideBookings: SerializedBooking[];
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

export interface AiHomeChatResponse {
  source: "groq" | "seeded-fallback";
  message: string;
}

export interface AiScheduleResponse {
  source: "groq" | "seeded-fallback";
  message: string;
  note?: string;
  trip: SerializedTrip;
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
  source: "google" | "open-meteo" | "fallback";
  hasAdverseWeather: boolean;
  adverseSummary: string | null;
  days: WeatherDaily[];
}

export interface TripWeatherResponse {
  tripId: number;
  hasAdverseWeather: boolean;
  stopForecasts: Array<{
    stopId: number;
    cityId: number;
    cityName: string;
    country: string;
    arrivalDate: string;
    departureDate: string;
    forecast: WeatherForecast;
  }>;
}

// ── Hotel Types (Overpass OSM) ──────────────────────────────────────

export interface Hotel {
  id: string;
  name: string;
  stars: number | null;
  rating?: number | null;
  reviewScore?: number | null;
  address: string;
  street: string | null;
  city: string;
  postcode: string | null;
  country: string;
  latitude: number;
  longitude: number;
  website: string | null;
  bookingUrl: string;
  photoUrl?: string | null;
  phone: string | null;
  email: string | null;
  amenities: string[];
  estimatedPricePerNight: number;
  currency: string;
  distanceKm: number;
  rooms?: number | null;
  wheelchair?: boolean | null;
  source?: "booking-com" | "overpass" | "curated";
}

export interface HotelListResponse {
  cityName: string;
  country: string;
  total: number;
  hotels: Hotel[];
}

// ── Food Suggestion Types (Groq) ────────────────────────────────────

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
  category: "must_try" | "street_food" | "sweet_dessert" | "beverage" | "classic";
  estimatedCost: number;
  whySpecial: string;
  foodieTip: string;
  bestPlacesNearHotel: FoodEatery[];
}

export interface FoodSuggestionsResponse {
  cityName: string;
  country: string;
  hotelName: string | null;
  cuisineOverview: string;
  source: "groq" | "fallback";
  foods: FoodItem[];
}

export interface AiFoodSuggestionsInput {
  cityName: string;
  country?: string;
  hotelName?: string | null;
  hotelAddress?: string | null;
  dietaryPreference?: string;
}

// ── Guides & bookings ────────────────────────────────────────────────

export type BookingStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";

export interface SerializedGuide {
  id: number;
  userId: number;
  name: string;
  /** Null until a booking with this guide is confirmed (admins always see it). */
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  languages: string[];
  specialties: string[];
  dailyRate: number;
  experienceYears: number;
  rating: number;
  isActive: boolean;
  isVerified: boolean;
  cityId: number;
  city?: SerializedCity;
  tripsGuided?: number;
  createdAt: string;
}

export interface SerializedBooking {
  id: number;
  guideId: number;
  touristId: number;
  tripId: number | null;
  cityId: number;
  startDate: string | null;
  endDate: string | null;
  days: number;
  headcount: number;
  dailyRate: number;
  totalCost: number;
  status: BookingStatus;
  notes: string | null;
  guideNote: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  guide?: SerializedGuide;
  tourist?: { id: number; name: string; email: string | null; phone: string | null; photoUrl: string | null };
  trip?: { id: number; name: string; startDate: string | null; endDate: string | null } | null;
  city?: SerializedCity;
}

export interface GuideProfileInput {
  cityId: number;
  headline?: string | null;
  bio?: string | null;
  languages?: string[];
  specialties?: string[];
  dailyRate: number;
  experienceYears?: number;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  photoUrl?: string | null;
  phone?: string | null;
  role?: UserRole;
  guideProfile?: GuideProfileInput;
}

export interface GuideListResponse {
  guides: SerializedGuide[];
  total: number;
  limit: number;
  offset: number;
}

export interface GuideDetailResponse {
  guide: SerializedGuide;
  busyRanges: Array<{ startDate: string; endDate: string }>;
}

export interface BookingListResponse {
  bookings: SerializedBooking[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateBookingInput {
  guideId: number;
  tripId?: number | null;
  startDate: string;
  endDate: string;
  headcount?: number;
  notes?: string | null;
}

export interface GuideAssignmentsResponse extends BookingListResponse {
  guide: SerializedGuide;
  stats: {
    pending: number;
    confirmed: number;
    upcoming: number;
    daysBooked: number;
    earnings: number;
  };
}

export interface AdminStats {
  travellers: number;
  guides: number;
  admins: number;
  activeGuides: number;
  trips: number;
  bookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  upcomingBookings: number;
  bookingRevenue: number;
  byStatus: Partial<Record<BookingStatus, number>>;
}

export interface AdminUser extends SerializedUser {
  tripCount: number;
  bookingCount: number;
  guide: SerializedGuide | null;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUpdateBookingInput {
  guideId?: number;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  headcount?: number;
  adminNote?: string | null;
  force?: boolean;
}
