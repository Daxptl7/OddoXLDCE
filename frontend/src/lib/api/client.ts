import { getToken } from "@/lib/auth/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetail[];

  constructor(status: number, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type Params = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Params;
  signal?: AbortSignal;
}

/**
 * One fetch wrapper for the whole app. Attaches the bearer token, unwraps the
 * `{ error: { message, details } }` envelope the backend uses, and throws
 * ApiError so callers can try/catch instead of checking res.ok everywhere.
 */
async function request<T>(path: string, { method = "GET", body, params, signal }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    signal,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? "Something went wrong",
      payload?.error?.details,
    );
  }

  return payload as T;
}

export const api = {
  get: <T,>(path: string, params?: Params, signal?: AbortSignal) => request<T>(path, { params, signal }),
  post: <T,>(path: string, body?: unknown, params?: Params) => request<T>(path, { method: "POST", body, params }),
  patch: <T,>(path: string, body?: unknown, params?: Params) => request<T>(path, { method: "PATCH", body, params }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};
