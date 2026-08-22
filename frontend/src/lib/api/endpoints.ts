import { api } from "./client";
import type {
  ActivityListResponse,
  AdminStats,
  AdminUpdateBookingInput,
  AdminUser,
  AdminUserListResponse,
  AddStopActivityInput,
  AiFoodSuggestionsInput,
  AiHomeChatResponse,
  AiOptimizeResponse,
  AiPlanInput,
  AiPlanResponse,
  AiRecommendResponse,
  AiScheduleResponse,
  AuthResponse,
  BookingListResponse,
  BookingStatus,
  CatalogueSort,
  CityListResponse,
  CreateStopInput,
  CreateTripInput,
  DashboardResponse,
  CreateBookingInput,
  FoodSuggestionsResponse,
  GuideAssignmentsResponse,
  GuideDetailResponse,
  GuideListResponse,
  GuideProfileInput,
  HotelListResponse,
  PublicTripResponse,
  SerializedActivity,
  SerializedBooking,
  SerializedCity,
  SerializedGuide,
  SerializedStop,
  SerializedStopActivity,
  SerializedTrip,
  SerializedUser,
  ShareResponse,
  SignupInput,
  TripBudget,
  TripDeepResponse,
  TripListResponse,
  TripScope,
  TripWeatherResponse,
  UpdateStopActivityInput,
  UpdateStopInput,
  UpdateTripInput,
  UserRole,
  WeatherForecast,
} from "@/lib/types";

export { ApiError } from "./client";

export const auth = {
  signup: (data: SignupInput) => api.post<AuthResponse>("/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post<AuthResponse>("/auth/login", data),
  logout: () => api.post<{ ok: true }>("/auth/logout"),
  me: () => api.get<{ user: SerializedUser }>("/auth/me"),
  updateProfile: (data: { name?: string; photoUrl?: string | null; phone?: string | null }) =>
    api.patch<{ user: SerializedUser }>("/auth/me", data),
};

/** The guide directory, plus the workspace a signed-in guide sees of their own work. */
export const guides = {
  list: (params?: {
    q?: string;
    cityId?: number;
    city?: string;
    country?: string;
    language?: string;
    maxRate?: number;
    startDate?: string;
    endDate?: string;
    sort?: "rating" | "price" | "experience";
    limit?: number;
    offset?: number;
  }) => api.get<GuideListResponse>("/guides", params),
  get: (id: number) => api.get<GuideDetailResponse>(`/guides/${id}`),
  me: () => api.get<{ guide: SerializedGuide }>("/guides/me"),
  updateMe: (data: Partial<GuideProfileInput> & { isActive?: boolean }) =>
    api.patch<{ guide: SerializedGuide }>("/guides/me", data),
  assignments: (params?: { status?: BookingStatus; scope?: "all" | "upcoming" | "past"; limit?: number }) =>
    api.get<GuideAssignmentsResponse>("/guides/me/assignments", params),
  respond: (bookingId: number, data: { status: "CONFIRMED" | "DECLINED" | "COMPLETED"; guideNote?: string | null }) =>
    api.patch<{ booking: SerializedBooking }>(`/guides/me/assignments/${bookingId}`, data),
};

/** A traveller's side of the same relationship: who they hired, and when. */
export const bookings = {
  list: (params?: { status?: BookingStatus; scope?: "all" | "upcoming" | "past"; limit?: number }) =>
    api.get<BookingListResponse>("/bookings", params),
  create: (data: CreateBookingInput) => api.post<{ booking: SerializedBooking }>("/bookings", data),
  get: (id: number) => api.get<{ booking: SerializedBooking }>(`/bookings/${id}`),
  cancel: (id: number, notes?: string) =>
    api.post<{ booking: SerializedBooking }>(`/bookings/${id}/cancel`, { notes }),
};

/** Admin-only. Every call here 403s for anyone else. */
export const admin = {
  stats: () => api.get<{ stats: AdminStats }>("/admin/stats"),
  users: (params?: { q?: string; role?: UserRole; limit?: number; offset?: number }) =>
    api.get<AdminUserListResponse>("/admin/users", params),
  setUserRole: (userId: number, data: { role: UserRole; cityId?: number; dailyRate?: number }) =>
    api.patch<{ user: AdminUser }>(`/admin/users/${userId}/role`, data),
  guides: (params?: {
    q?: string;
    cityId?: number;
    status?: "all" | "active" | "inactive" | "unverified";
    limit?: number;
  }) => api.get<GuideListResponse>("/admin/guides", params),
  updateGuide: (
    guideId: number,
    data: { isActive?: boolean; isVerified?: boolean; cityId?: number; dailyRate?: number },
  ) => api.patch<{ guide: SerializedGuide }>(`/admin/guides/${guideId}`, data),
  bookings: (params?: {
    q?: string;
    status?: BookingStatus;
    guideId?: number;
    cityId?: number;
    limit?: number;
  }) => api.get<BookingListResponse>("/admin/bookings", params),
  updateBooking: (bookingId: number, data: AdminUpdateBookingInput) =>
    api.patch<{ booking: SerializedBooking }>(`/admin/bookings/${bookingId}`, data),
  deleteBooking: (bookingId: number) =>
    api.delete<{ ok: true; deletedId: number }>(`/admin/bookings/${bookingId}`),
};

export const dashboard = {
  get: () => api.get<DashboardResponse>("/dashboard"),
};

export const trips = {
  list: (params?: { q?: string; scope?: TripScope; limit?: number; offset?: number }) =>
    api.get<TripListResponse>("/trips", params),
  create: (data: CreateTripInput) => api.post<{ trip: SerializedTrip }>("/trips", data),
  get: (id: number) => api.get<TripDeepResponse>(`/trips/${id}`),
  update: (id: number, data: UpdateTripInput) => api.patch<{ trip: SerializedTrip }>(`/trips/${id}`, data),
  remove: (id: number) => api.delete<{ ok: true; deletedId: number }>(`/trips/${id}`),
  budget: (id: number) => api.get<{ budget: TripBudget }>(`/trips/${id}/budget`),
  itinerary: (id: number) => api.get<{ itinerary: import("@/lib/types").Itinerary }>(`/trips/${id}/itinerary`),
  copy: (id: number) => api.post<{ trip: SerializedTrip }>(`/trips/${id}/copy`),
  share: (id: number) => api.post<ShareResponse>(`/trips/${id}/share`),
  unshare: (id: number) => api.delete<{ ok: true; isPublic: false }>(`/trips/${id}/share`),
};

export const stops = {
  list: (tripId: number) => api.get<{ stops: SerializedStop[] }>(`/trips/${tripId}/stops`),
  add: (tripId: number, data: CreateStopInput) => api.post<{ stop: SerializedStop }>(`/trips/${tripId}/stops`, data),
  update: (stopId: number, data: UpdateStopInput) => api.patch<{ stop: SerializedStop }>(`/stops/${stopId}`, data),
  remove: (stopId: number) => api.delete<{ ok: true; deletedId: number }>(`/stops/${stopId}`),
  /** orderedStopIds is the full list of the trip's stops, left to right. Dates re-flow unless keepDates. */
  reorder: (tripId: number, orderedStopIds: number[], { keepDates = false }: { keepDates?: boolean } = {}) =>
    api.patch<{ stops: SerializedStop[]; datesReflowed: boolean }>(
      `/trips/${tripId}/stops/reorder`,
      { order: orderedStopIds },
      { keepDates },
    ),
  addActivity: (stopId: number, data: AddStopActivityInput) =>
    api.post<{ stopActivity: SerializedStopActivity }>(`/stops/${stopId}/activities`, data),
};

export const stopActivities = {
  update: (id: number, data: UpdateStopActivityInput) =>
    api.patch<{ stopActivity: SerializedStopActivity }>(`/stop-activities/${id}`, data),
  remove: (id: number) => api.delete<{ ok: true; deletedId: number }>(`/stop-activities/${id}`),
};

export const catalogue = {
  cities: (params?: { q?: string; country?: string; region?: string; maxCostIndex?: number; sort?: CatalogueSort; limit?: number; offset?: number }) =>
    api.get<CityListResponse>("/cities", params),
  city: (id: number) => api.get<{ city: SerializedCity }>(`/cities/${id}`),
  cityActivities: (
    cityId: number,
    params?: { q?: string; category?: string; maxCost?: number; maxDuration?: number; sort?: CatalogueSort; limit?: number; offset?: number },
  ) => api.get<{ city: SerializedCity; activities: SerializedActivity[]; total: number }>(`/cities/${cityId}/activities`, params),
  activities: (params?: { q?: string; category?: string; maxCost?: number; maxDuration?: number; sort?: CatalogueSort; limit?: number; offset?: number }) =>
    api.get<ActivityListResponse>("/activities", params),
  categories: () => api.get<{ categories: { category: string; count: number }[] }>("/activities/categories"),
};

export const publicTrips = {
  /** No auth. The share page calls this and nothing else. */
  get: (slug: string) => api.get<PublicTripResponse>(`/public/${slug}`),
  copy: (slug: string) => api.post<{ trip: SerializedTrip }>(`/public/${slug}/copy`),
};

export const ai = {
  homeChat: (message: string) => api.post<AiHomeChatResponse>("/ai/home-chat", { message }),
  plan: (data: AiPlanInput) => api.post<AiPlanResponse>("/ai/plan", data),
  schedule: (prompt: string, tripId?: number) => api.post<AiScheduleResponse>("/ai/schedule", { prompt, tripId }),
  recommend: (tripId: number, limit = 3) => api.post<AiRecommendResponse>("/ai/recommend", { tripId, limit }),
  optimize: (tripId: number, targetBudget: number) =>
    api.post<AiOptimizeResponse>("/ai/optimize", { tripId, targetBudget }),
  foodSuggestions: (data: AiFoodSuggestionsInput) =>
    api.post<FoodSuggestionsResponse>("/ai/food-suggestions", data),
};

export const weather = {
  getCityWeather: (cityId: number, startDate?: string, endDate?: string) =>
    api.get<{ forecast: WeatherForecast }>(`/weather/city/${cityId}`, { startDate, endDate }),
  getTripWeather: (tripId: number) =>
    api.get<TripWeatherResponse>(`/weather/trip/${tripId}`),
};

export const hotels = {
  list: (params: { cityId?: number; cityName?: string; country?: string; q?: string; stars?: number; maxPrice?: number; limit?: number }) =>
    api.get<HotelListResponse>("/hotels", params),
};
