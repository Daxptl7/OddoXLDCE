import { api } from './client.js';

export { ApiError } from './client.js';

export const auth = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

export const dashboard = {
  get: () => api.get('/dashboard'),
};

export const trips = {
  list: (params) => api.get('/trips', params),
  create: (data) => api.post('/trips', data),
  /** Deep read: stops + cities + activities + warnings in one call. */
  get: (id) => api.get(`/trips/${id}`),
  update: (id, data) => api.patch(`/trips/${id}`, data),
  remove: (id) => api.delete(`/trips/${id}`),
  budget: (id) => api.get(`/trips/${id}/budget`),
  itinerary: (id) => api.get(`/trips/${id}/itinerary`),
  copy: (id) => api.post(`/trips/${id}/copy`),
  share: (id) => api.post(`/trips/${id}/share`),
  unshare: (id) => api.delete(`/trips/${id}/share`),
};

export const stops = {
  list: (tripId) => api.get(`/trips/${tripId}/stops`),
  add: (tripId, data) => api.post(`/trips/${tripId}/stops`, data),
  update: (stopId, data) => api.patch(`/stops/${stopId}`, data),
  remove: (stopId) => api.delete(`/stops/${stopId}`),
  /**
   * orderedStopIds is the full list of the trip's stops, left to right.
   * Dates re-flow to match the new order unless keepDates is true.
   */
  reorder: (tripId, orderedStopIds, { keepDates = false } = {}) =>
    api.patch(`/trips/${tripId}/stops/reorder`, { order: orderedStopIds }, { keepDates }),
  addActivity: (stopId, data) => api.post(`/stops/${stopId}/activities`, data),
};

export const stopActivities = {
  update: (id, data) => api.patch(`/stop-activities/${id}`, data),
  remove: (id) => api.delete(`/stop-activities/${id}`),
};

export const catalogue = {
  cities: (params) => api.get('/cities', params),
  city: (id) => api.get(`/cities/${id}`),
  cityActivities: (cityId, params) => api.get(`/cities/${cityId}/activities`, params),
  activities: (params) => api.get('/activities', params),
  categories: () => api.get('/activities/categories'),
};

export const publicTrips = {
  /** No auth. The share page calls this and nothing else. */
  get: (slug) => api.get(`/public/${slug}`),
};
