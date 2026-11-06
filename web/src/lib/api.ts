// ─────────────────────────────────────────────────────────────────────────────
// API client — thin fetch wrapper around the Express backend (/api/v1)
// ─────────────────────────────────────────────────────────────────────────────
import type { ApiEnvelope } from './types';

const rawBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
/** Base URL of the REST API. Defaults to same-origin `/api/v1` (Vite/Vercel proxy). */
export const API_BASE = `${rawBase.replace(/\/$/, '')}/api/v1`;

export class ApiError extends Error {
  status: number;
  details?: Array<{ field?: string; message: string }>;

  constructor(message: string, status: number, details?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData; // browser sets multipart boundary
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), 12000);
  const signal = opts.signal ?? timeoutCtrl.signal;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body,
      signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 204) {
    return { success: true, data: undefined as T };
  }

  type Body = ApiEnvelope<T> & { errors?: Array<{ field?: string; message: string }> };
  let json = null as Body | null;
  try {
    json = (await res.json()) as Body;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !json || json.success === false) {
    throw new ApiError(
      json?.errors?.[0]?.message ?? json?.message ?? `Request failed (${res.status})`,
      res.status,
      json?.errors,
    );
  }
  return json;
}

/** Public GET returning only the `data` payload. */
export async function getData<T>(path: string, signal?: AbortSignal): Promise<T> {
  return (await request<T>(path, { signal })).data;
}
