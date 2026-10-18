// my-project/src/Services/AdminUserService.ts

import axios, { AxiosRequestConfig } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Same base as before (http://localhost:8000/api/admin), built from API_URL.
// Always ends with a slash.
const ADMIN_URL = `${API_URL}admin/`;

const adminUrl = (path: string): string => `${ADMIN_URL}${path.replace(/^\/+/, '')}`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.
//
// Thin wrapper that keeps the old `api.get('/users/')` style working for any code
// that imports the default export.
const api = {
  get: <T = any>(path: string, config?: AxiosRequestConfig) =>
    axios.get<T>(adminUrl(path), config),
  post: <T = any>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
    axios.post<T>(adminUrl(path), data, config),
  put: <T = any>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
    axios.put<T>(adminUrl(path), data, config),
  patch: <T = any>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
    axios.patch<T>(adminUrl(path), data, config),
  delete: <T = any>(path: string, config?: AxiosRequestConfig) =>
    axios.delete<T>(adminUrl(path), config),
};

export interface UserChangeLog {
  id: number;
  target_user: number | null;
  target_user_email: string;
  changed_by: number | null;
  changed_by_email: string;
  action: string;
  action_display: string;
  field_name: string;
  previous_value: string | null;
  new_value: string | null;
  changed_at: string;
  request_method: string;
  request_path: string;
  ip_address: string | null;
}

export interface UserChangeLogFilters {
  target_user_email?: string;
  changed_by_email?: string;
  action?: string;
  field_name?: string;
}

export const fetchAllUsers = () => api.get('/users/');

export const blockUser = (id: number) =>
  api.patch(`/user/${id}/`, {
    action: 'block',
  });

export const unblockUser = (id: number) =>
  api.patch(`/user/${id}/`, {
    action: 'unblock',
  });

export const activateUser = (id: number) =>
  api.patch(`/user/${id}/`, {
    action: 'activate',
  });

export const editUser = (id: number, data: Record<string, unknown>) =>
  api.patch(`/user/${id}/`, {
    ...data,
    action: 'edit',
  });

export const deleteUser = (id: number) => api.delete(`/user/${id}/`);

/**
 * Fetch user and guardian audit logs.
 *
 * Supported filters:
 * - target_user_email
 * - changed_by_email
 * - action
 * - field_name
 */
export const fetchUserChangeLogs = (filters: UserChangeLogFilters = {}) =>
  api.get('/user-change-logs/', {
    params: filters,
  });

/**
 * Fetch all audit logs belonging to one user.
 */
export const fetchLogsForUser = (email: string) =>
  fetchUserChangeLogs({
    target_user_email: email,
  });

export default api;