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
  timeoutMs?: number;
}

/**
 * Combines caller's AbortSignal with a per-attempt timeout AbortController (F2).
 */
function createCombinedSignal(callerSignal: AbortSignal | undefined, timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs);

  const onCallerAbort = () => ctrl.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      ctrl.abort();
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  return {
    signal: ctrl.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (callerSignal) {
        callerSignal.removeEventListener('abort', onCallerAbort);
      }
    },
  };
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData; // browser sets multipart boundary
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  // F1 & F2: Allow 25s timeout for Render free-tier cold starts and retry GET once on timeout/502/503/504
  const timeoutMs = opts.timeoutMs ?? (method === 'GET' ? 25000 : 18000);
  const maxAttempts = method === 'GET' ? 2 : 1;

  let res: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { signal, cleanup } = createCombinedSignal(opts.signal, timeoutMs);
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body,
        signal,
      });

      if (
        attempt + 1 < maxAttempts &&
        (res.status === 502 || res.status === 503 || res.status === 504)
      ) {
        continue;
      }
      break;
    } catch (err) {
      lastError = err;
      // Do not retry if the caller explicitly aborted the request
      if (opts.signal?.aborted || attempt + 1 >= maxAttempts) {
        throw err;
      }
    } finally {
      cleanup();
    }
  }

  if (!res) {
    throw lastError instanceof Error ? lastError : new Error('Network request failed');
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
