import { apiFetch } from './client';

export const getClientes = (token) => apiFetch('/api/clientes', {}, token);
export const getCliente = (token, id) => apiFetch(`/api/clientes/${id}`, {}, token);
export const createCliente = (token, data) =>
  apiFetch('/api/clientes', { method: 'POST', body: JSON.stringify(data) }, token);
export const updateCliente = (token, id, data) =>
  apiFetch(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
export const deleteCliente = (token, id) =>
  apiFetch(`/api/clientes/${id}`, { method: 'DELETE' }, token);
