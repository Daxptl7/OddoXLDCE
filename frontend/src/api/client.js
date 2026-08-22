const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details; // [{ field, message }] on validation failures
  }
}

/**
 * One fetch wrapper for the whole app. Sends the session cookie, unwraps the
 * `{ error: { message } }` envelope the backend uses, and throws ApiError so
 * callers can `try/catch` instead of checking `res.ok` everywhere.
 */
async function request(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? 'Something went wrong',
      payload?.error?.details,
    );
  }

  return payload;
}

export const api = {
  get: (path, params, signal) => request(path, { params, signal }),
  post: (path, body, params) => request(path, { method: 'POST', body, params }),
  patch: (path, body, params) => request(path, { method: 'PATCH', body, params }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
