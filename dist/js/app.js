// Punto de entrada: rutas, SEO por sección, eventos globales y formularios.
import {CONFIG, waLink} from './config.js';
import {api, server, loadCatalog, loadUser} from './api.js';
import {state, save, productById, cartCount, reconcileCart} from './store.js';
import {hydrate, icon, debounce, toast, showModal, closeModal, isModalOpen, success} from './ui.js';
import {home, catalog, productPage} from './shop.js';
import {servicePage, howPage, affiliatePage, contactPage, infoPage, services} from './content.js';
import {addToCart, changeQuantity, removeFromCart, showCart, showCheckout, updateDeliveryFields, submitOrder} from './checkout.js';
import * as acc from './account.js';

const main = document.querySelector('#main');
const searchInput = document.querySelector('#search');

// ---------- SEO por sección ----------
const SEO = {
  inicio: ['Animal World · Todo para tu mascota en Aragua', 'Productos y servicios para perros, gatos, aves, peces y más de comercios locales de Aragua. Haz tu pedido por WhatsApp.'],
  catalogo: ['Catálogo de productos para mascotas', 'Alimentos, juguetes, accesorios e higiene para tu mascota. Filtra por mascota, precio y tienda.'],
  favoritos: ['Tus favoritos', 'Los productos que guardaste para tu mascota.'],
  servicios: ['Servicios para mascotas en Aragua', 'Peluquería, consulta veterinaria, paseos y cuidado para tu mascota. Solicita información.'],
  'como-funciona': ['Cómo funciona', 'Elige tus productos, envía el pedido por WhatsApp y recíbelo en casa o retíralo.'],
  afiliate: ['Afíliate: vende en Animal World', 'Publica los productos y servicios de tu comercio en Animal World y llega a más hogares de Aragua.'],
  ayuda: ['Preguntas frecuentes', 'Respuestas sobre pedidos, pagos, entregas, devoluciones y cómo vender en Animal World.'],
  nosotros: ['Nuestra historia', 'Animal World reúne productos y servicios de comercios locales de Aragua en un solo lugar.'],
  envios: ['Envíos y retiros', 'Entrega local y retiro coordinado en el centro de Aragua.'],
  devoluciones: ['Cambios y devoluciones', 'Qué hacer si un producto llega dañado, defectuoso o distinto al pedido.'],
  contacto: ['Contacto', 'Escríbenos para consultas, pedidos o para afiliar tu negocio.'],
  cuenta: ['Mi cuenta', 'Tus pedidos y datos en Animal World.'],
  panel: ['Mi tienda', 'Panel de tienda aliada de Animal World.'],
  admin: ['Administración', 'Panel de administración de Animal World.']
};
const PRIVATE = ['cuenta', 'panel', 'admin'];

function setMeta(path, params) {
  let [title, desc] = SEO[path] || ['Página no encontrada', 'Vuelve al inicio de Animal World.'];
  if (path === 'producto') {
    const p = productById(params.get('id'));
    if (p) { title = p.name; desc = `${p.short || p.name} ${p.unit}. Cómpralo en Animal World y recíbelo en Aragua.`; }
  }
  document.title = path === 'inicio' ? title : `${title} · Animal World`;
  const set = (sel, val) => document.querySelector(sel)?.setAttribute('content', val);
  set('meta[name=description]', desc);
  set('meta[property="og:title"]', document.title);
  set('meta[property="og:description"]', desc);
  set('meta[name=robots]', PRIVATE.includes(path) ? 'noindex' : 'index,follow');
}

// ---------- Router ----------
const route = () => {
  const [path, q] = (location.hash.slice(1) || 'inicio').split('?');
  return {path, params: new URLSearchParams(q)};
};
const views = {
  inicio: [home],
  catalogo: [(p) => catalog(p)],
  favoritos: [(p) => catalog(p, true)],
  servicios: [servicePage],
  'como-funciona': [howPage],
  producto: [productPage],
  afiliate: [affiliatePage],
  contacto: [contactPage],
  cuenta: [acc.accountPage, acc.accountLoad],
  panel: [acc.panelPage, acc.panelLoad],
  admin: [acc.adminPage, acc.adminLoad]
};
let lastPath = null;
function render() {
  const {path, params} = route();
  if (document.activeElement !== searchInput) searchInput.value = params.get('q') || '';
  const [view, after] = views[path] || [() => infoPage(path)];
  main.innerHTML = view(params);
  hydrate(main);
  updateChrome();
  setMeta(path, params);
  document.querySelectorAll('.nav a, .mobile-nav a').forEach(a => {
    const here = a.getAttribute('href')?.slice(1).split('?')[0] === path && !(a.getAttribute('href').includes('?') && path === 'catalogo');
    a.toggleAttribute('aria-current', here);
    if (here) a.setAttribute('aria-current', 'page');
  });
  if (path !== lastPath) {
    if (lastPath !== null) { window.scrollTo({top: 0, behavior: 'instant'}); main.focus({preventScroll: true}); }
    lastPath = path;
  }
  after?.();
  wireFilterToggle();
}

function wireFilterToggle() {
  const filters = main.querySelector('.filters');
  if (!filters || main.querySelector('.filter-toggle')) return;
  const b = document.createElement('button');
  b.className = 'filter-toggle button secondary';
  b.dataset.action = 'toggle-filters';
  b.setAttribute('aria-expanded', 'false');
  b.setAttribute('aria-controls', 'catalog-filters');
  b.innerHTML = `${icon('grid')}<span>Filtrar productos</span>`;
  filters.before(b);
}

function updateChrome() {
  const n = cartCount();
  document.querySelector('#cart-count').textContent = n;
  document.querySelector('#mobile-cart-count').textContent = n;
  document.querySelector('#current-location').textContent = `${state.location}, Aragua`;
  const u = document.querySelector('#account-link');
  u.setAttribute('aria-label', state.user ? `Mi cuenta (${state.user.name})` : 'Iniciar sesión o crear cuenta');
  u.classList.toggle('logged', !!state.user);
  const wa = document.querySelector('#wa-float');
  wa.href = waLink('Hola, tengo una consulta sobre Animal World.');
}

function setParams(mutate) {
  const {path, params} = route();
  mutate(params);
  const qs = params.toString();
  location.hash = `${path}${qs ? '?' + qs : ''}`;
}

async function refreshCatalog() {
  state.catalog = await loadCatalog();
  reconcileCart();
  render();
}

// ---------- Eventos ----------
const actions = {
  'toggle-filters'(b) {
    const f = main.querySelector('.filters');
    const open = f.classList.toggle('is-open');
    b.setAttribute('aria-expanded', String(open));
    b.querySelector('span').textContent = open ? 'Ocultar filtros' : 'Filtrar productos';
  },
  close: closeModal,
  cart: showCart,
  add: (b) => addToCart(b.dataset.id),
  favorite(b) {
    const id = b.dataset.id;
    const on = !state.favorites.includes(id);
    state.favorites = on ? [...state.favorites, id] : state.favorites.filter(v => v !== id);
    save();
    toast(on ? 'Guardado en tus favoritos ♥' : 'Quitado de tus favoritos');
    if (route().path === 'favoritos' || route().path === 'producto') return render();
    document.querySelectorAll(`[data-action=favorite][data-id="${id}"]`).forEach(el => { el.classList.toggle('active', on); el.setAttribute('aria-pressed', String(on)); });
  },
  quantity: (b) => changeQuantity(b.dataset.id, Number(b.dataset.delta)),
  remove: (b) => removeFromCart(b.dataset.id),
  checkout: showCheckout,
  shop() { closeModal(); location.hash = 'catalogo'; },
  book(b) { const s = services.find(s => s.id === b.dataset.id); if (s) acc.bookingForm(s); },
  'clear-filters'() { location.hash = route().path; },
  gallery(b) {
    document.querySelector('#gallery-main').src = b.dataset.src;
    document.querySelectorAll('.thumb').forEach(t => { const on = t === b; t.classList.toggle('active', on); t.setAttribute('aria-pressed', String(on)); });
  },
  'ask-product'(b) {
    const p = productById(b.dataset.id);
    if (p) window.open(waLink(`Hola, quiero consultar por: ${p.name} (${p.unit}).\n${location.href}`), '_blank', 'noopener');
  },
  async 'copy-order'(b) {
    try { await navigator.clipboard.writeText(b.dataset.message); toast('Mensaje copiado'); } catch { toast('No se pudo copiar. Selecciona el texto manualmente.'); }
  },
  location() {
    showModal(`<h2 class="modal-title">¿Dónde está tu mascota?</h2><p>Elige tu zona para preparar tus pedidos.</p>
      <div class="location-options">${CONFIG.cities.map(c => `<button data-action="select-location" data-id="${c}">${icon('pin')} ${c}, Aragua</button>`).join('')}</div>`, 'Zona');
  },
  'select-location'(b) { state.location = b.dataset.id; save(); closeModal(); toast('Zona actualizada'); },
  auth: (b) => acc.authModal(b.dataset.mode),
  logout: acc.logout,
  'new-product': () => acc.productForm(),
  'edit-product': (b) => { const p = acc.findPanelProduct(b.dataset.id); if (p) acc.productForm(p); },
  approve: (b) => acc.reviewProduct(b.dataset.id, 'approved'),
  reject: (b) => acc.reviewProduct(b.dataset.id, 'rejected'),
  'approve-affiliate': (b) => acc.approveAffiliate(b.dataset.id)
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (b) actions[b.dataset.action]?.(b);
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'pet' || t.name === 'category' || t.name === 'price' || t.name === 'vendor') setParams(p => (t.value ? p.set(t.name, t.value) : p.delete(t.name)));
  if (t.id === 'sort') setParams(p => (t.value && t.value !== 'featured' ? p.set('sort', t.value) : p.delete('sort')));
  if (t.dataset.stock) acc.updateStock(t.dataset.stock, t.value);
  if (t.dataset.item) acc.updateItem(t.dataset.item, t.value);
  if (t.dataset.order) acc.setOrderStatus(t.dataset.order, t.value);
  if (t.dataset.request) acc.setRequestStatus(t.dataset.request, t.dataset.id, t.value);
  if (t.id === 'delivery') updateDeliveryFields(t.value === 'pickup');
});

// Búsqueda en vivo mientras se escribe.
searchInput.addEventListener('input', debounce(() => {
  const q = searchInput.value.trim();
  const {path, params} = route();
  const next = path === 'catalogo' ? params : new URLSearchParams();
  if (q) next.set('q', q); else next.delete('q');
  const hash = `#catalogo${next.toString() ? '?' + next : ''}`;
  if (path === 'catalogo') { history.replaceState(null, '', hash); render(); } else if (q) location.hash = hash;
}, 160));

const needServer = () => { toast('Esta función necesita el servidor de la tienda y no está disponible ahora.'); };
async function send(path, data, done) {
  if (!server.online) return needServer();
  try { await api.post(path, data); done(); } catch (e) { toast(e.message); }
}
document.addEventListener('submit', async e => {
  const form = e.target;
  if (!form.matches('form')) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  switch (form.id) {
    case 'search-form': { const q = searchInput.value.trim(); location.hash = `catalogo${q ? '?q=' + encodeURIComponent(q) : ''}`; searchInput.blur(); break; }
    case 'newsletter-form': await send('/subscribe', d, () => { success('¡Una buena noticia más!', 'Te avisaremos de las novedades de Animal World.'); form.reset(); }); break;
    case 'contact-form': await send('/messages', d, () => { success('Mensaje enviado', 'Gracias por escribirnos. Te responderemos a la brevedad.'); form.reset(); }); break;
    case 'affiliate-form': await send('/affiliates', d, () => { success('Solicitud enviada', 'Revisaremos tu solicitud y nos pondremos en contacto contigo.'); form.reset(); }); break;
    case 'booking-form': await send('/service-requests', {...d, service: form.dataset.service}, () => success('Solicitud recibida', 'El equipo confirmará disponibilidad y fecha contigo antes de agendar.')); break;
    case 'checkout-form': await submitOrder(form); break;
    case 'login-form': case 'register-form': await acc.submitAuth(form); break;
    case 'password-form': await acc.submitPassword(form); break;
    case 'product-form': await acc.submitProduct(form); break;
  }
});

window.addEventListener('hashchange', () => { if (isModalOpen()) closeModal(); render(); });
document.addEventListener('store:change', updateChrome);
document.addEventListener('auth:change', () => { updateChrome(); render(); });
document.addEventListener('catalog:refresh', refreshCatalog);
document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); main.scrollIntoView(); });

// ---------- Inicio ----------
hydrate();
main.setAttribute('aria-busy', 'true');
state.catalog = await loadCatalog();
state.user = await loadUser();
reconcileCart();
main.removeAttribute('aria-busy');
render();
