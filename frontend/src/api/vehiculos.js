import { apiFetch } from './client';

export const getVehiculos = (token) => apiFetch('/api/vehiculos', {}, token);
export const getVehiculo = (token, id) => apiFetch(`/api/vehiculos/${id}`, {}, token);
export const getVehiculoPorPatente = (token, patente) =>
  apiFetch(`/api/vehiculos/patente/${encodeURIComponent(patente)}`, {}, token);
export const createVehiculo = (token, data) =>
  apiFetch('/api/vehiculos', { method: 'POST', body: JSON.stringify(data) }, token);
export const updateVehiculo = (token, id, data) =>
  apiFetch(`/api/vehiculos/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
export const deleteVehiculo = (token, id) =>
  apiFetch(`/api/vehiculos/${id}`, { method: 'DELETE' }, token);
