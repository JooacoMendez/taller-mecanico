import { apiFetch } from './client';

export const getOrdenes = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/ordenes${qs ? '?' + qs : ''}`, {}, token);
};
export const getOrden = (token, id) => apiFetch(`/api/ordenes/${id}`, {}, token);
export const createOrden = (token, data) =>
  apiFetch('/api/ordenes', { method: 'POST', body: JSON.stringify(data) }, token);
export const updateOrden = (token, id, data) =>
  apiFetch(`/api/ordenes/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
export async function cambiarEstadoOrden(token, id, estado) {
  return await apiFetch(`/api/ordenes/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ estado })
  });
}

export async function finalizarPresupuesto(token, id) {
  return await apiFetch(`/api/ordenes/${id}/finalizar-presupuesto`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export const deleteOrden = (token, id) =>
  apiFetch(`/api/ordenes/${id}`, { method: 'DELETE' }, token);

export const addItem = (token, ordenId, data) =>
  apiFetch(`/api/ordenes/${ordenId}/items`, { method: 'POST', body: JSON.stringify(data) }, token);
export const updateItem = (token, itemId, data) =>
  apiFetch(`/api/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }, token);
export const deleteItem = (token, itemId) =>
  apiFetch(`/api/items/${itemId}`, { method: 'DELETE' }, token);

export const registrarPago = (token, ordenId, data) =>
  apiFetch(`/api/ordenes/${ordenId}/pagos`, { method: 'POST', body: JSON.stringify(data) }, token);
export const getPagos = (token, ordenId) =>
  apiFetch(`/api/ordenes/${ordenId}/pagos`, {}, token);
