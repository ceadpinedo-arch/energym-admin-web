export const API_URL = 'https://energym-production-7371.up.railway.app';

export async function login(dni, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dni, password }),
  });
  if (!res.ok) { let m = 'DNI o contrase\u00f1a incorrectos'; try { const j = await res.json(); if (j && j.suspendido) m = j.error; } catch (e) { m = m; } throw new Error(m); }
  return res.json();
}

export async function apiGet(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Error en ${path}`);
  return res.json();
}

export async function apiPatch(path, token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error en ${path}`);
  return res.json();
}

export async function apiPost(path, token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error en ${path}`);
  return res.json();
}

export async function apiDelete(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Error en ${path}`);
}

export async function apiPut(path, token, body) {
  const res = await fetch(API_URL + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error en ' + path);
  return res.json();
}
