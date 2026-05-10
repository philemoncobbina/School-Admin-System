// AdminUserService.ts

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/admin',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchAllUsers  = ()               => api.get(`/users/`);
export const blockUser      = (id: number)     => api.patch(`/user/${id}/`, { action: 'block' });
export const unblockUser    = (id: number)     => api.patch(`/user/${id}/`, { action: 'unblock' });
export const activateUser   = (id: number)     => api.patch(`/user/${id}/`, { action: 'activate' });
export const editUser       = (id: number, data: object) => api.patch(`/user/${id}/`, { ...data, action: 'edit' });
export const deleteUser     = (id: number)     => api.delete(`/user/${id}/`);