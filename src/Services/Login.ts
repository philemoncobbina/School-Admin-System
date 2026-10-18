// #Login.ts

import axios from 'axios';
import { API_URL, setSessionExpiredHandler, setupHttp } from './http';

export type AuthUser = { id: number; email: string; role: string };

const USER_KEY = 'user';
const LOGIN_TIME_KEY = 'loginTime';
const LEGACY_KEYS = ['access_token', 'refresh_token', 'isLogged', 'user_data'];

const IDLE_MS = 60 * 60 * 1000; // 1 hour of inactivity
const MAX_SESSION_MS = 4 * 60 * 60 * 1000; // 4 hours in total

// ---- Client-side state (UI hints only; the cookies are the real credentials) ----

export const getStoredUser = (): AuthUser | null => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
  } catch {
    return null;
  }
};

const clearClientSession = () => {
  [USER_KEY, LOGIN_TIME_KEY, ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k));
};

/** @deprecated Cookies carry the credentials now. Kept so existing `headers: getAuthHeaders()` calls still work. */
export const getAuthHeaders = (): Record<string, string> => ({});

export const isLoggedInSync = (): boolean => !!getStoredUser();

export const isLoggedIn = async (): Promise<{ loggedIn: boolean; user?: AuthUser }> => {
  try {
    const { data } = await axios.get(`${API_URL}session-check/`, { skipAuthRedirect: true });
    if (data.authenticated) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { loggedIn: true, user: data.user };
    }
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
      clearClientSession();
    } else {
      console.error('Session check failed:', error);
    }
  }
  return { loggedIn: false };
};

// ---- Login / logout ----

export const login = async (email: string, password: string) => {
  try {
    const { data } = await axios.post(`${API_URL}login-auth/`, { email, password });
    localStorage.setItem(USER_KEY, JSON.stringify(data.user)); // tokens are in HttpOnly cookies; ignore any in the body
    localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    initSessionTimers();
    return { success: true as const, user: data.user as AuthUser };
  } catch (error: any) {
    const message = error.response
      ? error.response.data?.error ?? 'An unknown error occurred'
      : 'Unable to reach the server. Check your connection.';
    return { success: false as const, error: message as string };
  }
};

export const logout = async (): Promise<void> => {
  stopSessionTimers();
  try {
    await axios.post(`${API_URL}logout-auth/`, {}, { skipAuthRedirect: true });
  } catch (error) {
    console.error('Failed to log out on the server:', error);
  } finally {
    clearClientSession();
    window.location.replace('/login');
  }
};

// ---- Session timers (UI convenience; the server enforces the real limits) ----

let idleTimer: ReturnType<typeof setTimeout> | undefined;
let maxTimer: ReturnType<typeof setTimeout> | undefined;
let lastActivity = Date.now();
let listening = false;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart'] as const;

const armIdleTimer = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => void logout(), IDLE_MS);
};

const onActivity = () => {
  const now = Date.now();
  if (now - lastActivity < 1000) return; // throttle mousemove
  lastActivity = now;
  armIdleTimer();
};

// Timers pause while a laptop sleeps, so re-check the clock when the tab comes back.
const onVisible = () => {
  if (document.visibilityState !== 'visible') return;
  const started = Number(localStorage.getItem(LOGIN_TIME_KEY)) || Date.now();
  if (Date.now() - lastActivity > IDLE_MS || Date.now() - started > MAX_SESSION_MS) void logout();
};

export const stopSessionTimers = () => {
  clearTimeout(idleTimer);
  clearTimeout(maxTimer);
  if (listening) {
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    document.removeEventListener('visibilitychange', onVisible);
    listening = false;
  }
};

export const initSessionTimers = () => {
  stopSessionTimers();
  if (!isLoggedInSync()) return;

  const started = Number(localStorage.getItem(LOGIN_TIME_KEY)) || Date.now();
  localStorage.setItem(LOGIN_TIME_KEY, String(started));

  const remaining = started + MAX_SESSION_MS - Date.now();
  if (remaining <= 0) {
    void logout();
    return;
  }
  maxTimer = setTimeout(() => void logout(), remaining);

  lastActivity = Date.now();
  ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
  document.addEventListener('visibilitychange', onVisible);
  listening = true;
  armIdleTimer();
};

/** Old names, so existing imports keep compiling. */
export const startTestSessionTimer = initSessionTimers;
export const startIdleTimer = () => undefined; // initSessionTimers handles both

// ---- Startup ----

export const initAuth = () => {
  setupHttp();
  setSessionExpiredHandler(() => {
    stopSessionTimers();
    clearClientSession();
    if (!window.location.pathname.startsWith('/login')) window.location.replace('/login');
  });

  // A session from the old token-in-localStorage version can't work any more: start at login.
  if (localStorage.getItem('access_token')) clearClientSession();

  initSessionTimers(); // also restores the timers after a page reload (the old code didn't)
};

export const fetchData = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
};