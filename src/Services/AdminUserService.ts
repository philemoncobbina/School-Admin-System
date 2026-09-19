import axios from 'axios';


const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


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


export const editUser = (
  id: number,
  data: Record<string, unknown>,
) =>
  api.patch(`/user/${id}/`, {
    ...data,
    action: 'edit',
  });


export const deleteUser = (id: number) =>
  api.delete(`/user/${id}/`);


/**
 * Fetch user and guardian audit logs.
 *
 * Supported filters:
 * - target_user_email
 * - changed_by_email
 * - action
 * - field_name
 */
export const fetchUserChangeLogs = (
  filters: UserChangeLogFilters = {},
) =>
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