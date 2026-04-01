// Detectar si es desarrollo o producción
// En Electron, VITE_API_URL puede no estar disponible, usamos localhost:3001
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('📡 API Base URL:', API_BASE_URL);

function getHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

function buildUrl(path) {
  // Si la ruta ya comienza con http, usarla tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Si comienza con /, prepend la URL base
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  // En otro caso, agregar barra
  return `${API_BASE_URL}/${path}`;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  console.log('🌐 Fetch:', url);
  
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
