import { apiFetch } from './client';

export const loginApi = (email, password) =>
  apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const meApi = (token) => apiFetch('/api/auth/me', {}, token);
