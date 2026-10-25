// Mejoras de experiencia: sugerencias de búsqueda, vista rápida, perfil de tienda, filtros activos,
// opiniones de ejemplo, vistos recientemente y barra de compra en móvil.
import {CONFIG, waLink} from './config.js';
import {state, products, productById, vendorById} from './store.js';
import {icon, esc, money, bs, normal, fuzzyHas, showModal, page} from './ui.js';
import {productCard} from './shop.js';

// ---------- Sugerencias al buscar ----------
const input = document.querySelector('#search');
const list = document.querySelector('#suggest');
let active = -1;

function matches(q) {
  const words = normal(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return products().filter(p => {
    const hay = normal(`${p.name} ${p.brand} ${p.category} ${p.pet} ${p.vendorName || ''}`);
    return words.every(w => fuzzyHas(hay, w));
  }).slice(0, 5);
}
function hideSuggest() {
  list.hidden = true; active = -1;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}
function showSuggest() {
  const q = input.value.trim();
  if (q.length < 2) return hideSuggest();
  const found = matches(q);
  list.innerHTML = found.map((p, i) => `<li role="option" id="sg-${i}"><a href="#producto?id=${esc(p.id)}"><img src="${esc(p.images[0])}" alt="" width="40" height="40"><span><b>${esc(p.name)}</b><small>${esc(p.unit)}</small></span><em>${money(p.price)}</em></a></li>`).join('')
    + (found.length ? '' : `<li class="none" role="presentation">Sin coincidencias exactas para «${esc(q)}»</li>`)
    + `<li role="option" id="sg-all"><a href="#catalogo?q=${encodeURIComponent(q)}">${icon('search')} Ver todos los resultados</a></li>`;
  list.hidden = false; active = -1;
  input.setAttribute('aria-expanded', 'true');
}
function move(dir) {
  const items = [...list.querySelectorAll('[role=option] a')];
  if (!items.length) return;
  active = (active + dir + items.length) % items.length;
  items.forEach((a, i) => a.classList.toggle('on', i === active));
  input.setAttribute('aria-activedescendant', items[active].parentElement.id);
}
input.addEventListener('input', showSuggest);
input.addEventListener('focus', showSuggest);
input.addEventListener('keydown', e => {
  if (list.hidden) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (e.key === 'Escape') hideSuggest();
  else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); list.querySelectorAll('[role=option] a')[active].click(); }
});
document.addEventListener('click', e => { if (!e.target.closest('#search-form')) hideSuggest(); });
list.addEventListener('click', hideSuggest);
document.addEventListener('submit', e => { if (e.target.id === 'search-form') hideSuggest(); });
window.addEventListener('hashchange', () => { if (!/^#catalogo/.test(location.hash)) hideSuggest(); });

// ---------- Vista rápida ----------
export function quickView(id) {
  const p = productById(id);
  if (!p) return;
  const out = p.stock <= 0;
  showModal(`<div class="qv">
    <img src="${esc(p.images[0])}" alt="${esc(p.name)}" width="260" height="250">
    <div><div class="eyebrow">${esc(p.vendorName || vendorById(p.vendor)?.name || p.brand)}</div>
      <h2 class="modal-title">${esc(p.name)}</h2>
      <p class="detail-unit">${esc(p.unit)}</p>
      <div class="detail-price"><span class="price">${money(p.price)}</span>${p.old ? `<span class="old-price">${money(p.old)}</span>` : ''}</div>
      ${bs(p.price) ? `<p class="bs-line">${bs(p.price)} <small>${esc(CONFIG.rateNote)}</small></p>` : ''}
      <p class="stock-message ${out ? 'out' : ''}">${out ? 'Agotado por ahora' : p.stock <= 5 ? `Quedan pocas unidades (${p.stock})` : 'Disponible'}</p>
      <p>${esc(p.short || '')}</p></div></div>
    <button class="button wide" data-action="add" data-id="${esc(p.id)}" ${out ? 'disabled' : ''}>Añadir al carrito ${icon('bag')}</button>
    <a class="button secondary wide" href="#producto?id=${esc(p.id)}">Ver ficha completa</a>`, 'Vista rápida');
}

// ---------- Perfil de tienda ----------
export function storePage(params) {
  const v = vendorById(params.get('id'));
  if (!v) return page('Tienda no encontrada', 'Es posible que ya no esté en Animal World.', '<a href="#catalogo" class="button">Volver al catálogo</a>', 'Tienda');
  const mine = products().filter(p => p.vendor === v.id);
  const pets = [...new Set(mine.map(p => p.pet))].map(p => (p === 'Pequeños' ? 'Pequeños amigos' : p));
  const others = state.catalog.vendors.filter(o => o.id !== v.id);
  return page(esc(v.name), esc(v.about || ''), `<section class="store-hero">
      <div class="store-badge">${icon('store')}</div>
      <div><ul class="store-facts"><li>${icon('pin')} ${esc(v.city || 'Aragua')}, Aragua</li><li>${icon('bag')} ${mine.length} producto${mine.length === 1 ? '' : 's'}</li>${pets.length ? `<li>${icon('heart')} ${esc(pets.join(' · '))}</li>` : ''}</ul>
      <p class="subtle">Tienda aliada de Animal World. Los pedidos se confirman por WhatsApp.</p></div>
      <a class="button wa-button" href="${waLink(`Hola, quiero consultar por productos de ${v.name} en Animal World.`)}" target="_blank" rel="noopener">Escribir por WhatsApp ${icon('chat')}</a>
    </section>
    <div class="products-grid">${mine.map(productCard).join('') || '<div class="empty"><h2>Aún no hay productos publicados</h2></div>'}</div>
    ${others.length ? `<section class="section"><div class="section-head"><h2>Otras tiendas aliadas</h2></div><div class="stores">${others.map(o =>
      `<a class="store-card" href="#tienda?id=${esc(o.id)}">${icon('store')}<b>${esc(o.name)}</b><span>${esc(o.city || 'Aragua')}</span><small>${esc(o.about || '')}</small></a>`).join('')}</div></section>` : ''}`, v.name);
}

// ---------- Filtros activos del catálogo ----------
export function catalogAfter(params) {
  const labels = {pet: v => (v === 'Pequeños' ? 'Pequeños amigos' : v), category: v => v, vendor: v => vendorById(v)?.name || v,
    price: v => (CONFIG.priceRanges.find(r => r[0] === v) || [, v])[1], q: v => `«${v}»`};
  const chips = Object.keys(labels).filter(k => params.get(k)).map(k => {
    const next = new URLSearchParams(params); next.delete(k);
    const qs = next.toString();
    return `<a class="chip" href="#${location.hash.slice(1).split('?')[0]}${qs ? '?' + qs : ''}" aria-label="Quitar filtro ${esc(labels[k](params.get(k)))}">${esc(labels[k](params.get(k)))} <span aria-hidden="true">×</span></a>`;
  });
  const bar = document.querySelector('.catalog-toolbar');
  if (!bar || !chips.length) return;
  bar.insertAdjacentHTML('beforebegin', `<div class="chips" aria-label="Filtros aplicados">${chips.join('')}</div>`);
}

// ---------- Ficha de producto: avisos, opiniones y recientes ----------
const RECENT = 'animalworld-recent';
const recent = () => { try { return JSON.parse(localStorage.getItem(RECENT) || '[]').filter(id => typeof id === 'string'); } catch { return []; } };
const SAMPLE = [
  ['Mariana R.', 5, 'Llegó rápido y mi perro se lo comió todo el primer día.'],
  ['Carlos P.', 5, 'Buena calidad por el precio. El trato por WhatsApp fue muy amable.'],
  ['Luisa G.', 4, 'Tal como en las fotos. Lo volvería a pedir.'],
  ['Andrés M.', 5, 'Mi gato lo aprobó de inmediato. Muy recomendado.'],
  ['Daniela S.', 4, 'Todo bien empacado y con la entrega coordinada sin problemas.'],
  ['José A.', 5, 'Me ayudaron a elegir el tamaño correcto. Excelente atención.']
];
const stars = n => `<span class="stars" role="img" aria-label="${n} de 5 estrellas">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;

export function productAfter(params) {
  const p = productById(params.get('id'));
  if (!p) return;
  const seen = recent().filter(id => id !== p.id);
  const wrap = document.querySelector('main .page');
  const row = document.querySelector('.detail-info .button-row');
  if (p.stock <= 0 && row) row.insertAdjacentHTML('afterend', `<a class="link-button" href="${waLink(`Hola, avísenme cuando vuelva a estar disponible: ${p.name} (${p.unit}).`)}" target="_blank" rel="noopener">${icon('chat')} Avísame cuando vuelva</a>`);
  const start = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % SAMPLE.length;
  const reviews = [0, 1, 2].map(i => SAMPLE[(start + i) % SAMPLE.length]);
  const avg = (reviews.reduce((a, r) => a + r[1], 0) / reviews.length).toFixed(1).replace('.', ',');
  wrap?.insertAdjacentHTML('beforeend', `<section class="section reviews" aria-labelledby="h-rev"><div class="section-head"><div><h2 id="h-rev">Opiniones</h2><p>${stars(5)} ${avg} de 5 · ${reviews.length} opiniones</p></div><span class="sample-badge">Opiniones de ejemplo</span></div>
    <div class="quotes">${reviews.map(([n, s, t]) => `<figure class="quote">${stars(s)}<blockquote>${esc(t)}</blockquote><figcaption>${esc(n)}</figcaption></figure>`).join('')}</div></section>
    ${seen.length ? `<section class="section" aria-labelledby="h-seen"><div class="section-head"><h2 id="h-seen">Vistos recientemente</h2></div><div class="products-grid">${seen.map(productById).filter(Boolean).slice(0, 4).map(productCard).join('')}</div></section>` : ''}`);
  if (p.stock > 0) {
    document.body.insertAdjacentHTML('beforeend', `<div class="sticky-buy" id="sticky-buy"><div><b>${money(p.price)}</b><small>${esc(p.name)}</small></div><button class="button" data-action="add" data-id="${esc(p.id)}">Añadir ${icon('bag')}</button></div>`);
  }
  try { localStorage.setItem(RECENT, JSON.stringify([p.id, ...seen].slice(0, 8))); } catch { /* sin almacenamiento */ }
}

// Quita la barra fija al salir de la ficha.
export const clearSticky = () => document.querySelector('#sticky-buy')?.remove();
