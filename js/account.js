// Cuentas: acceso, perfil, panel de tienda aliada y administración.
import {CONFIG} from './config.js';
import {api, server} from './api.js';
import {state} from './store.js';
import {icon, esc, money, dateEs, page, showModal, closeModal, toast, success} from './ui.js';

const STATUS_PRODUCT = {approved: 'Publicado', pending: 'En revisión', rejected: 'Rechazado'};
const ORDER_STATUS = ['Recibido', 'Confirmado', 'En preparación', 'En camino', 'Entregado', 'Cancelado'];
const REQUEST_STATUS = ['Nueva', 'En contacto', 'Atendida', 'Descartada'];
const PRESET_IMAGES = [
  ['assets/food-green.svg', 'Bolsa de alimento (verde)'], ['assets/food-coral.svg', 'Bolsa de alimento (coral)'],
  ['assets/food-yellow.svg', 'Bolsa de semillas'], ['assets/fish-food.svg', 'Frasco de alimento'], ['assets/shampoo.svg', 'Frasco de champú'],
  ['assets/litter.svg', 'Arena'], ['assets/rope.svg', 'Juguete'], ['assets/bowl.svg', 'Plato'], ['assets/bed.svg', 'Cama'],
  ['assets/brush.svg', 'Cepillo'], ['assets/hay.svg', 'Heno'], ['assets/shelter.svg', 'Refugio']
];

const unavailable = () => `<div class="empty">${icon('shield')}<h2>Las cuentas no están disponibles ahora</h2><p>Esta función necesita el servidor de la tienda. Vuelve a intentarlo en unos minutos.</p><a href="#inicio" class="button">Volver al inicio</a></div>`;

// ---------- Acceso ----------
export function authModal(mode = 'login') {
  const login = mode === 'login';
  showModal(`<h2 class="modal-title">${login ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
    <p>${login ? 'Accede para ver tus pedidos o gestionar tu tienda.' : 'Guarda tus pedidos y datos para comprar más rápido.'}</p>
    <form id="${login ? 'login-form' : 'register-form'}">
      ${login ? '' : '<div class="field"><label for="reg-name">Nombre</label><input id="reg-name" name="name" required maxlength="80" autocomplete="name"></div>'}
      <div class="field"><label for="auth-email">Correo</label><input id="auth-email" name="email" type="email" required maxlength="120" autocomplete="email"></div>
      <div class="field"><label for="auth-pass">Contraseña${login ? '' : ' <small>(mínimo 8 caracteres)</small>'}</label><input id="auth-pass" name="password" type="password" required minlength="${login ? 1 : 8}" maxlength="100" autocomplete="${login ? 'current-password' : 'new-password'}"></div>
      <p class="form-error" id="auth-error" role="alert" hidden></p>
      <button class="button wide" type="submit">${login ? 'Entrar' : 'Crear cuenta'}</button></form>
    <p class="auth-switch">${login ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'} <button class="link-button" data-action="auth" data-mode="${login ? 'register' : 'login'}">${login ? 'Crear cuenta' : 'Iniciar sesión'}</button></p>`,
    login ? 'Iniciar sesión' : 'Crear cuenta');
}

export async function submitAuth(form) {
  const d = Object.fromEntries(new FormData(form));
  const error = document.querySelector('#auth-error');
  error.hidden = true;
  try {
    const res = await api.post(form.id === 'login-form' ? '/auth/login' : '/auth/register', d);
    state.user = res.user;
    closeModal();
    document.dispatchEvent(new CustomEvent('auth:change'));
    toast(`Hola, ${res.user.name.split(' ')[0]} ♥`);
    if (res.user.role === 'admin') location.hash = 'admin';
    else if (res.user.role === 'vendor') location.hash = 'panel';
    else if (location.hash === '#cuenta' || !location.hash) location.hash = 'cuenta';
  } catch (e) { error.textContent = e.message; error.hidden = false; }
}

export async function logout() {
  try { await api.post('/auth/logout'); } catch { /* ya no hay sesión */ }
  state.user = null;
  document.dispatchEvent(new CustomEvent('auth:change'));
  location.hash = 'inicio';
  toast('Sesión cerrada');
}

export async function submitPassword(form) {
  const d = Object.fromEntries(new FormData(form));
  try {
    await api.post('/auth/password', {current: d.current, password: d.password});
    if (state.user) state.user.mustChange = false;
    form.reset();
    document.dispatchEvent(new CustomEvent('auth:change'));
    toast('Contraseña actualizada');
  } catch (e) { toast(e.message); }
}

const passwordForm = (forced) => `<form id="password-form" class="content-card"><h2>${forced ? 'Cambia tu contraseña temporal' : 'Cambiar contraseña'}</h2>
  ${forced ? '<p class="note">Entraste con una contraseña temporal. Elige una nueva para continuar.</p>' : ''}
  <div class="field"><label for="pw-current">Contraseña actual</label><input id="pw-current" name="current" type="password" required autocomplete="current-password" maxlength="100"></div>
  <div class="field"><label for="pw-new">Nueva contraseña <small>(mínimo 8 caracteres)</small></label><input id="pw-new" name="password" type="password" required minlength="8" maxlength="100" autocomplete="new-password"></div>
  <button class="button" type="submit">Guardar contraseña</button></form>`;

// ---------- Pedidos ----------
function orderCard(o, {manage = false, vendor = false} = {}) {
  return `<article class="order-card"><div class="order-head"><b>${esc(o.code)}</b>
      ${manage ? `<label class="inline-select"><span class="sr-only">Estado del pedido ${esc(o.code)}</span><select data-order="${esc(o.code)}">${ORDER_STATUS.map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>` : `<span class="status">${esc(o.status)}</span>`}</div>
    <p>${dateEs(o.date)} · ${esc(o.delivery)} · ${esc(o.payment)} · ${esc(o.city)}</p>
    <ul class="order-items">${o.items.map(i => `<li><span>${i.qty} × ${esc(i.name)}</span>${vendor ? `<label class="inline-select"><span class="sr-only">Estado de ${esc(i.name)}</span><select data-item="${i.id}">${['Pendiente', 'Preparado'].map(s => `<option ${i.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>` : `<b>${money(i.price * i.qty)}</b>`}</li>`).join('')}</ul>
    ${o.customer ? `<p class="order-contact"><b>${esc(o.customer)}</b> · ${esc(o.phone)}${o.address ? `<br>${esc(o.address)}` : ''}${o.notes ? `<br><i>${esc(o.notes)}</i>` : ''}</p>` : ''}
    ${vendor ? '' : `<p class="order-total">Total: <b>${money(o.total)}</b></p>`}</article>`;
}
const orderList = (orders, opts) => orders.length ? orders.map(o => orderCard(o, opts)).join('') : '<p class="subtle">Todavía no hay pedidos.</p>';

// ---------- Mi cuenta ----------
export function accountPage() {
  if (!server.online) return page('Mi cuenta', '', unavailable());
  const u = state.user;
  if (!u) return page('Un lugar para ti y tu mascota', 'Inicia sesión o crea tu cuenta para ver tus pedidos.',
    `<div class="content-card narrow-card"><div class="button-row"><button class="button" data-action="auth" data-mode="login">Iniciar sesión</button><button class="button secondary" data-action="auth" data-mode="register">Crear cuenta</button></div></div>`, 'Mi cuenta');
  const links = u.role === 'admin' ? '<a class="button" href="#admin">Ir a administración</a>' : u.role === 'vendor' ? '<a class="button" href="#panel">Ir a mi panel de tienda</a>' : '<a href="#favoritos" class="button secondary">Mis favoritos</a>';
  return page(`Hola, ${esc(u.name.split(' ')[0])}`, esc(u.email), `<div class="info-grid"><div>
      <div class="content-card"><h2>Tu cuenta</h2><p>Rol: ${u.role === 'admin' ? 'Administración' : u.role === 'vendor' ? 'Tienda aliada' : 'Cliente'}</p>
        <div class="button-row">${links}<button class="button secondary" data-action="logout">Cerrar sesión</button></div></div>
      <div style="margin-top:25px">${passwordForm(u.mustChange)}</div></div>
    <div class="content-card"><h2>Mis pedidos</h2><div id="my-orders" aria-live="polite"><p class="subtle">Cargando…</p></div></div></div>`, 'Mi cuenta');
}
export async function accountLoad() {
  const box = document.querySelector('#my-orders');
  if (!box || !state.user) return;
  try { box.innerHTML = orderList((await api.get('/orders')).orders); } catch (e) { box.innerHTML = `<p class="form-error">${esc(e.message)}</p>`; }
}

const guard = (roles, title) => {
  if (!server.online) return page(title, '', unavailable());
  if (!state.user || !roles.includes(state.user.role)) return page(title, 'Esta área es solo para cuentas autorizadas.',
    `<div class="content-card narrow-card"><button class="button" data-action="auth" data-mode="login">Iniciar sesión</button></div>`);
  if (state.user.mustChange) return page(title, '', `<div class="narrow-card">${passwordForm(true)}</div>`);
  return null;
};

// ---------- Panel de tienda aliada ----------
export function panelPage() {
  return guard(['vendor'], 'Tu espacio de tienda') || page('Tu espacio de tienda', 'Gestiona tu catálogo y los pedidos que incluyen tus productos.',
    `<div id="panel-body" aria-live="polite"><p class="subtle">Cargando…</p></div>`, 'Mi tienda');
}
let panelProducts = [];
export async function panelLoad() {
  const box = document.querySelector('#panel-body');
  if (!box) return;
  try {
    const [p, o] = await Promise.all([api.get('/vendor/products'), api.get('/orders')]);
    panelProducts = p.products;
    const pending = panelProducts.filter(x => x.status === 'pending').length;
    box.innerHTML = `<div class="stats"><div class="stat"><small>Productos</small><b>${panelProducts.length}</b></div><div class="stat"><small>En revisión</small><b>${pending}</b></div><div class="stat"><small>Pedidos</small><b>${o.orders.length}</b></div></div>
      <div class="section-head"><div><h2>Mi catálogo</h2><p>Los productos nuevos o editados se publican tras la revisión de la administración. Las existencias se actualizan al instante.</p></div><button class="button" data-action="new-product">${icon('plus')} Añadir producto</button></div>
      <div class="table-wrap"><table><thead><tr><th>Producto</th><th>Precio</th><th>Existencias</th><th>Estado</th><th></th></tr></thead><tbody>
      ${panelProducts.map(x => `<tr><td>${esc(x.name)}<br><small>${esc(x.pet)} · ${esc(x.category)}</small></td><td>${money(x.price)}</td>
        <td><label><span class="sr-only">Existencias de ${esc(x.name)}</span><input type="number" min="0" max="9999" step="1" value="${x.stock}" data-stock="${esc(x.id)}"></label></td>
        <td><span class="status ${x.status === 'approved' ? '' : 'pending'}">${STATUS_PRODUCT[x.status] || x.status}</span></td>
        <td><button class="mini-button" data-action="edit-product" data-id="${esc(x.id)}">Editar</button></td></tr>`).join('') || '<tr><td colspan="5">Aún no tienes productos. Añade el primero.</td></tr>'}</tbody></table></div>
      <div class="content-card" style="margin-top:28px"><h2>Pedidos con tus productos</h2>${orderList(o.orders, {vendor: true})}</div>`;
  } catch (e) { box.innerHTML = `<p class="form-error">${esc(e.message)}</p>`; }
}

export function productForm(p = null) {
  const sel = (name, list, cur) => `<select name="${name}" id="np-${name}">${list.map(v => `<option ${v === cur ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  const img = p?.images?.[0] || PRESET_IMAGES[0][0];
  const preset = PRESET_IMAGES.some(([v]) => v === img);
  showModal(`<h2 class="modal-title">${p ? 'Editar producto' : 'Añadir producto'}</h2>
    <p>${p ? 'Al guardar, el producto vuelve a revisión antes de mostrarse.' : 'Se enviará a revisión antes de aparecer en el catálogo.'}</p>
    <form id="product-form" data-id="${esc(p?.id || '')}">
      <div class="field"><label for="np-name">Nombre del producto</label><input id="np-name" name="name" required maxlength="100" value="${esc(p?.name || '')}"></div>
      <div class="form-grid">
        <div class="field"><label for="np-brand">Marca</label><input id="np-brand" name="brand" required maxlength="50" value="${esc(p?.brand || '')}"></div>
        <div class="field"><label for="np-unit">Presentación</label><input id="np-unit" name="unit" required maxlength="60" placeholder="Bolsa · 1 kg" value="${esc(p?.unit || '')}"></div>
        <div class="field"><label for="np-price">Precio (USD)</label><input id="np-price" name="price" type="number" inputmode="decimal" required min="0.01" max="10000" step="0.01" value="${p ? p.price : ''}"></div>
        <div class="field"><label for="np-stock">Existencias</label><input id="np-stock" name="stock" type="number" inputmode="numeric" required min="0" max="9999" step="1" value="${p ? p.stock : ''}"></div>
        <div class="field"><label for="np-pet">Mascota</label>${sel('pet', CONFIG.pets, p?.pet)}</div>
        <div class="field"><label for="np-category">Categoría</label>${sel('category', CONFIG.categories, p?.category)}</div></div>
      <div class="field"><label for="np-short">Resumen <small>(una línea)</small></label><input id="np-short" name="short" maxlength="140" value="${esc(p?.short || '')}"></div>
      <div class="field"><label for="np-description">Descripción</label><textarea id="np-description" name="description" maxlength="800" rows="3">${esc(p?.description || '')}</textarea></div>
      <div class="field"><label for="np-image">Imagen</label><select id="np-image" name="image">${PRESET_IMAGES.map(([v, t]) => `<option value="${v}" ${v === img ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="np-url">O dirección de una imagen (https) <small>(opcional)</small></label><input id="np-url" name="imageUrl" type="url" maxlength="300" placeholder="https://" value="${preset ? '' : esc(img)}"></div>
      <button class="button wide" type="submit">${p ? 'Guardar y enviar a revisión' : 'Enviar a revisión'}</button></form>`, p ? 'Editar producto' : 'Añadir producto');
}
export const findPanelProduct = id => panelProducts.find(p => p.id === id);

export async function submitProduct(form) {
  const d = Object.fromEntries(new FormData(form));
  const data = {name: d.name, brand: d.brand, unit: d.unit, price: d.price, stock: d.stock, pet: d.pet, category: d.category,
    short: d.short, description: d.description, images: [d.imageUrl?.trim() || d.image]};
  try {
    if (form.dataset.id) await api.patch(`/vendor/products/${form.dataset.id}`, data); else await api.post('/vendor/products', data);
    closeModal();
    toast('Producto enviado a revisión');
    panelLoad();
  } catch (e) { toast(e.message); }
}

export async function updateStock(id, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 9999) { toast('Introduce una existencia entera entre 0 y 9999.'); return panelLoad(); }
  try { await api.patch(`/vendor/products/${id}`, {stock: n}); toast('Existencias actualizadas'); } catch (e) { toast(e.message); }
}
export async function updateItem(id, status) {
  try { await api.patch(`/order-items/${id}`, {status}); toast('Estado actualizado'); } catch (e) { toast(e.message); }
}

// ---------- Administración ----------
export function adminPage() {
  return guard(['admin'], 'Administración') || page('Administración', 'Pedidos, catálogo y solicitudes de la plataforma.', `<div id="admin-body" aria-live="polite"><p class="subtle">Cargando…</p></div>`, 'Administración');
}
const requestRows = (list, kind, cols) => list.map(r => `<div class="order-card"><div class="order-head"><b>${esc(r[cols[0]])}</b>
    <label class="inline-select"><span class="sr-only">Estado</span><select data-request="${kind}" data-id="${r.id}">${REQUEST_STATUS.concat(r.status === 'Aprobada' ? ['Aprobada'] : []).map(s => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
    <p>${cols.slice(1).map(c => esc(r[c])).filter(Boolean).join(' · ')}<br><small>${dateEs(r.created_at)}</small></p>
    ${kind === 'affiliates' && r.status !== 'Aprobada' ? `<button class="mini-button" data-action="approve-affiliate" data-id="${r.id}">Aprobar y crear cuenta de tienda</button>` : ''}</div>`).join('') || '<p class="subtle">Sin registros.</p>';

export async function adminLoad() {
  const box = document.querySelector('#admin-body');
  if (!box) return;
  try {
    const [s, o] = await Promise.all([api.get('/admin/summary'), api.get('/orders')]);
    box.innerHTML = `<div class="stats"><div class="stat"><small>Pedidos</small><b>${s.stats.orders}</b></div><div class="stat"><small>Ventas registradas</small><b>${money(s.stats.sales)}</b></div><div class="stat"><small>Productos publicados</small><b>${s.stats.products}</b></div></div>
      <div class="content-card"><h2>Productos por revisar</h2><div class="table-wrap"><table><thead><tr><th>Producto</th><th>Tienda</th><th>Precio</th><th>Acción</th></tr></thead><tbody>
      ${s.pending.map(p => `<tr><td>${esc(p.name)}<br><small>${esc(p.pet)} · ${esc(p.category)}</small></td><td>${esc(p.vendor)}</td><td>${money(p.price)}</td>
        <td><button class="mini-button" data-action="approve" data-id="${esc(p.id)}">Aprobar</button><button class="mini-button" data-action="reject" data-id="${esc(p.id)}">Rechazar</button></td></tr>`).join('') || '<tr><td colspan="4">No hay productos pendientes.</td></tr>'}</tbody></table></div></div>
      <div class="content-card" style="margin-top:25px"><h2>Pedidos</h2>${orderList(o.orders, {manage: true})}</div>
      <div class="info-grid" style="margin-top:25px"><div class="content-card"><h2>Solicitudes de afiliación</h2>${requestRows(s.affiliates, 'affiliates', ['business', 'name', 'phone', 'email', 'city', 'type'])}</div>
        <div class="content-card"><h2>Solicitudes de servicios</h2>${requestRows(s.services, 'services', ['service', 'name', 'pet', 'phone', 'preferred_date'])}</div></div>
      <div class="content-card" style="margin-top:25px"><h2>Mensajes de contacto</h2>${s.messages.map(m => `<div class="order-card"><b>${esc(m.name)}</b> · ${esc(m.email)}<p>${esc(m.topic)} — ${esc(m.message)}<br><small>${dateEs(m.created_at)}</small></p></div>`).join('') || '<p class="subtle">Sin mensajes.</p>'}</div>`;
  } catch (e) { box.innerHTML = `<p class="form-error">${esc(e.message)}</p>`; }
}

export async function reviewProduct(id, status) {
  try { await api.patch(`/admin/products/${id}`, {status}); toast(status === 'approved' ? 'Producto aprobado' : 'Producto rechazado'); document.dispatchEvent(new CustomEvent('catalog:refresh')); adminLoad(); } catch (e) { toast(e.message); }
}
export async function setOrderStatus(code, status) {
  try { await api.patch(`/orders/${code}`, {status}); toast('Pedido actualizado'); document.dispatchEvent(new CustomEvent('catalog:refresh')); } catch (e) { toast(e.message); adminLoad(); }
}
export async function setRequestStatus(kind, id, status) {
  try { await api.patch(`/admin/requests/${kind}/${id}`, {status}); toast('Estado actualizado'); } catch (e) { toast(e.message); }
}
export async function approveAffiliate(id) {
  try {
    const r = await api.post(`/admin/affiliates/${id}/approve`);
    success('Tienda creada', 'Entrega estos datos de acceso a la tienda. La contraseña temporal solo se muestra ahora y deberá cambiarla al entrar.',
      `<div class="confirmation-summary">Correo: <b>${esc(r.email)}</b><br>Contraseña temporal: <b class="mono">${esc(r.tempPassword)}</b></div>`);
    document.dispatchEvent(new CustomEvent('catalog:refresh'));
    adminLoad();
  } catch (e) { toast(e.message); }
}

export function bookingForm(service) {
  const t = new Date(); t.setDate(t.getDate() + 1);
  const min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  showModal(`<h2 class="modal-title">${esc(service.name)}</h2>
    <p>Déjanos tus datos y el equipo confirmará disponibilidad y fecha contigo. Esto no agenda la cita todavía.</p>
    ${server.online ? '' : '<p class="note">El envío necesita el servidor de la tienda y no está disponible ahora.</p>'}
    <form id="booking-form" data-service="${esc(service.name)}">
      <div class="field"><label for="book-name">Tu nombre</label><input id="book-name" name="name" required maxlength="80" autocomplete="name" value="${esc(state.user?.name || '')}"></div>
      <div class="form-grid"><div class="field"><label for="book-pet">Mascota y especie</label><input id="book-pet" name="pet" required maxlength="80" placeholder="Milo · Perro"></div>
        <div class="field"><label for="book-phone">Teléfono</label><input type="tel" name="phone" id="book-phone" required maxlength="25" autocomplete="tel"></div></div>
      <div class="field"><label for="book-date">Fecha deseada</label><input type="date" id="book-date" name="date" required min="${min}"></div>
      <button class="button wide" type="submit" ${server.online ? '' : 'disabled'}>Enviar solicitud</button></form>`, service.name);
}
