// Utilidades de interfaz: iconos, formato, avisos y ventanas.
const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  bag: '<path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  truck: '<path d="M2 5h12v12H2zm12 5h4l4 4v3h-8"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/>',
  shield: '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
  card: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h4"/>',
  chat: '<path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L2 22l2-6A9 9 0 1 1 21 11Z"/><path d="M8 10h8m-8 4h5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  scissors: '<circle cx="5" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><path d="m8 7 14 14M8 17 22 3"/>',
  medical: '<path d="M8 2v5a4 4 0 0 0 8 0V2M6 2h4m4 0h4M12 11v5a5 5 0 0 0 10 0v-3"/><circle cx="21" cy="10" r="2"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v13h14V9M9 22v-8h6v8"/>',
  walk: '<circle cx="14" cy="4" r="2"/><path d="m7 10 4-3 5 4h4M11 7l-2 8 4 3v4M9 15l-5 7"/>',
  bird: '<path d="M6 15c-1-7 5-13 11-10l4 4-4 2c0 7-4 10-11 8l-4 2 1-6h3Z"/><path d="m7 11 5 3-5 2m3 3-1 3m5-4 1 4"/><circle cx="15" cy="8" r=".7"/>',
  fish: '<path d="M18 12c-6-10-13-6-16 0 3 6 10 10 16 0Zm0 0 4-6v12l-4-6Z"/><circle cx="6" cy="11" r=".6"/><path d="m9 5 4-3 2 5m-6 12 4 3 2-5"/>',
  rabbit: '<path d="M8 11C0-2 13-1 11 10M14 10c-1-14 11-11 4 3M5 16c0-7 15-7 15 0s-15 7-15 0Z"/><circle cx="9" cy="15" r=".5"/><circle cx="16" cy="15" r=".5"/><path d="m11 18 2-1 1 1"/>',
  turtle: '<path d="M4 14c0-12 16-12 16 0H4Z"/><path d="m8 5 4 5 4-5m-4 5v4M6 14l-2 5m13-5 3 5"/><circle cx="22" cy="12" r="2"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  repeat: '<path d="M3 11a9 9 0 0 1 16-6l2 3M21 3v5h-5M21 13a9 9 0 0 1-16 6l-2-3M3 21v-5h5"/>',
  store: '<path d="M3 9 5 3h14l2 6M3 9v12h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9 21v-6h6v6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>'
};
export const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] || icons.heart}</svg>`;
export function hydrate(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); });
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const number = new Intl.NumberFormat('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
export const money = n => `${number.format(n)} $`;
export const normal = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const dateEs = iso => new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('es-VE', {day: 'numeric', month: 'short', year: 'numeric'});

let toastTimer;
export function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3600);
}

const modal = document.querySelector('#modal');
const modalBody = document.querySelector('#modal-body');
let returnFocus;
export function showModal(html, label = 'Ventana') {
  returnFocus = document.activeElement;
  modal.setAttribute('aria-label', label);
  modalBody.innerHTML = html;
  hydrate(modalBody);
  if (!modal.open) modal.showModal();
  document.body.classList.add('modal-open');
}
export function closeModal() {
  if (modal.open) modal.close();
  document.body.classList.remove('modal-open');
  returnFocus?.focus?.();
}
modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
modal.addEventListener('click', e => {
  if (e.target !== modal) return;
  const r = modal.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal();
});
export const isModalOpen = () => modal.open;

export function success(title, message, extra = '') {
  showModal(`<div class="success-icon">${icon('check')}</div><h2 class="modal-title">${title}</h2><p>${message}</p>${extra}<button class="button wide" data-action="close">Listo</button>`, title);
}

// Página estándar con migas de pan.
export const page = (title, subtitle, body, crumb = title) =>
  `<div class="wrap page"><nav class="breadcrumb" aria-label="Ruta"><a href="#inicio">Inicio</a> / <span>${esc(crumb)}</span></nav>
   <div class="page-title"><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${body}</div>`;
