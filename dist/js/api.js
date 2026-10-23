// Cliente de la API. Si el servidor no está disponible (alojamiento estático), el catálogo se lee de data/catalog.json
// y las funciones que requieren servidor (cuentas, pedidos guardados) quedan desactivadas.
export const server = {online: false};

async function request(path, {method = 'GET', data} = {}) {
  const res = await fetch(`/api${path}`, {
    method, credentials: 'same-origin',
    headers: data ? {'content-type': 'application/json'} : undefined,
    body: data ? JSON.stringify(data) : undefined
  });
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw Object.assign(new Error('Servidor no disponible'), {offline: true});
  const out = await res.json();
  if (!res.ok) throw Object.assign(new Error(out.error || 'Error inesperado'), {status: res.status});
  return out;
}

export const api = {
  get: path => request(path),
  post: (path, data = {}) => request(path, {method: 'POST', data}),
  patch: (path, data) => request(path, {method: 'PATCH', data})
};

export async function loadCatalog() {
  try {
    const out = await api.get('/catalog');
    server.online = true;
    return out;
  } catch {
    server.online = false;
    const res = await fetch('data/catalog.json');
    return res.json();
  }
}

export async function loadUser() {
  if (!server.online) return null;
  try { return (await api.get('/me')).user; } catch { return null; }
}
