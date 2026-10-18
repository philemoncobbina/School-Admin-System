// # my-project/src/Services/http.ts

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    _csrfRetry?: boolean;
    /** Skip the redirect to /login when the session is gone (used by route guards). */
    skipAuthRedirect?: boolean;
  }
}

const rawUrl: string =  'https://api.cobbina.uk/api/';
export const API_URL = rawUrl.replace(/\/*$/, '/');

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const NO_REFRESH_PATHS = ['login-auth/', 'token-refresh-auth/', 'csrf-auth/', 'logout-auth/'];

// No interceptors on this one: it makes the CSRF and refresh calls themselves.
const raw = axios.create({ withCredentials: true, timeout: 15000 });

let onSessionExpired: () => void = () => undefined;
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

function isApiRequest(config: { url?: string; baseURL?: string }): boolean {
  const url = config.url ?? '';
  const full = /^https?:\/\//i.test(url)
    ? url
    : `${(config.baseURL ?? '').replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  return full.startsWith(API_URL); // never send credentials or the CSRF token to other sites
}

// ---- CSRF token (kept in memory, fetched on demand) ----
let csrfToken: string | null = null;
let csrfInFlight: Promise<string> | null = null;

export async function ensureCsrfToken(force = false): Promise<string> {
  if (csrfToken && !force) return csrfToken;
  if (!csrfInFlight) {
    csrfInFlight = raw
      .get<{ csrfToken: string }>(`${API_URL}csrf-auth/`)
      .then((r) => (csrfToken = r.data.csrfToken))
      .finally(() => {
        csrfInFlight = null;
      });
  }
  return csrfInFlight;
}

// ---- Refresh (one at a time, however many requests got a 401) ----
let refreshInFlight: Promise<void> | null = null;

async function postRefresh(token: string) {
  await raw.post(`${API_URL}token-refresh-auth/`, {}, { headers: { 'X-CSRFToken': token } });
}

function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        await postRefresh(await ensureCsrfToken());
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 403) {
          await postRefresh(await ensureCsrfToken(true)); // stale CSRF token: retry once
        } else {
          throw e;
        }
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

const isCsrfFailure = (e: AxiosError) => {
  const d = e.response?.data as { detail?: unknown } | undefined;
  return typeof d?.detail === 'string' && d.detail.startsWith('CSRF Failed');
};

function install(instance: AxiosInstance) {
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (!isApiRequest(config)) return config;
    config.withCredentials = true;
    if (UNSAFE_METHODS.has((config.method ?? 'get').toUpperCase())) {
      try {
        config.headers['X-CSRFToken'] = await ensureCsrfToken();
      } catch {
        /* the server answers 403 if it needed the token */
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config;
      if (!config || !isApiRequest(config)) return Promise.reject(error);
      const status = error.response?.status;

      if (status === 403 && !config._csrfRetry && isCsrfFailure(error)) {
        config._csrfRetry = true;
        try {
          await ensureCsrfToken(true);
        } catch {
          return Promise.reject(error);
        }
        return instance(config);
      }

      const url = config.url ?? '';
      if (status === 401 && !config._retry && !NO_REFRESH_PATHS.some((p) => url.includes(p))) {
        config._retry = true;
        try {
          await refreshSession();
        } catch {
          if (!config.skipAuthRedirect) onSessionExpired();
          return Promise.reject(error);
        }
        return instance(config);
      }

      // Refreshed but still 401: the account was blocked or deactivated.
      if (status === 401 && config._retry && !config.skipAuthRedirect) onSessionExpired();

      return Promise.reject(error);
    },
  );
}

/** Call once at startup. Pass any extra axios.create() instances your code uses. */
export function setupHttp(...extra: AxiosInstance[]) {
  [axios, ...extra].forEach(install);
}