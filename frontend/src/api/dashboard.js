import { apiFetch } from './client';

export const getDashboard = (token) => apiFetch('/api/dashboard', {}, token);
