import { api } from "./client";
import type {
  ActivityListResponse,
  AddStopActivityInput,
  AiOptimizeResponse,
  AiHomeChatResponse,
  AiPlanInput,
  AiPlanResponse,
  AiRecommendResponse,
  AiScheduleResponse,
  AuthResponse,
  CatalogueSort,
  CityListResponse,
  CreateStopInput,
  CreateTripInput,
  DashboardResponse,
  PublicTripResponse,
  SerializedActivity,
  SerializedCity,
  SerializedStop,
  SerializedStopActivity,
  SerializedTrip,
  SerializedUser,
  ShareResponse,
  TripBudget,
  TripDeepResponse,
  TripListResponse,
  TripScope,
  UpdateStopActivityInput,
  UpdateStopInput,
  UpdateTripInput,
} from "@/lib/types";

export { ApiError } from "./client";

export const auth = {
  signup: (data: { name: string; email: string; password: string; photoUrl?: string | null }) =>
    api.post<AuthResponse>("/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post<AuthResponse>("/auth/login", data),
  logout: () => api.post<{ ok: true }>("/auth/logout"),
  me: () => api.get<{ user: SerializedUser }>("/auth/me"),
  updateProfile: (data: { name?: string; photoUrl?: string | null }) =>
    api.patch<{ user: SerializedUser }>("/auth/me", data),
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
};
