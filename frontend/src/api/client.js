function getHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
