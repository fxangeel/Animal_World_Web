// Movimiento y cabecera: estado al hacer scroll, menú móvil, búsqueda desplegable, revelado y parallax del hero.
const header = document.querySelector('#site-header');
const menuBtn = document.querySelector('#menu-toggle');
const searchBtn = document.querySelector('#search-toggle');
const searchInput = document.querySelector('#search');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 720px)');

let observer = null;
let ticking = false;
let lastY = 0;
let current = null;

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  if (open) setSearch(false);
  update();
}

function setSearch(open) {
  header.classList.toggle('search-open', open);
  searchBtn.setAttribute('aria-expanded', String(open));
  if (open) { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); setTimeout(() => searchInput.focus(), 60); }
  update();
}

function update() {
  ticking = false;
  const y = Math.max(0, scrollY);
  const home = document.body.dataset.page === 'inicio';
  const open = header.classList.contains('search-open') || document.body.classList.contains('menu-open');
  header.classList.toggle('solid', !home || y > 40 || open);
  header.classList.toggle('hide', y > lastY + 4 && y > 220 && !open);
  if (y < lastY - 4 || y < 220) header.classList.remove('hide');
  lastY = y;
  // Un salto de scroll puede dejar atrás bloques que nunca llegaron a cruzar la pantalla: se muestran al instante.
  document.querySelectorAll('.rv:not(.in)').forEach(el => { if (el.getBoundingClientRect().bottom < 0) { el.classList.add('in'); observer?.unobserve(el); } });
  const hero = document.querySelector('.hero-blue');
  if (hero && !reduce.matches) hero.style.setProperty('--p', Math.min(1, y / innerHeight).toFixed(3));
}

const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

// Marca los bloques que entran con animación. Sin IntersectionObserver o con "reducir movimiento" todo queda visible.
const targets = '.benefit,.section-head,.pet-tile,.product,.step,.store-card,.quote,.services-banner,.local-banner,.newsletter .wrap>*,.service-card,.content-card,.page-title,.faq details,.catalog-toolbar,.filters,.detail-info,.gallery-main';

function reveal() {
  observer?.disconnect();
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
  }, {rootMargin: '0px 0px -8% 0px', threshold: .08});
  const groups = new Map();
  document.querySelectorAll(`main :is(${targets})`).forEach(el => {
    if (el.closest('.hero-blue') || el.classList.contains('rv')) return;
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * (phone.matches ? 45 : 70)}ms`);
    el.classList.add('rv');
    observer.observe(el);
  });
}

function countUp() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = Number(el.dataset.count);
    if (reduce.matches || !to) return;
    const t0 = performance.now() + 700;
    const step = now => {
      const k = Math.min(1, Math.max(0, (now - t0) / 900));
      el.textContent = `${Math.round(to * (1 - Math.pow(1 - k, 3)))}+`;
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = '0+';
    requestAnimationFrame(step);
  });
}

// Se llama después de cada render de la vista.
export function refreshMotion(path) {
  document.body.dataset.page = path === 'inicio' || path === '' ? 'inicio' : path;
  if (path !== current) { setMenu(false); setSearch(false); lastY = scrollY; current = path; }
  update();
  reveal();
  countUp();
}

menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
searchBtn.addEventListener('click', () => setSearch(!header.classList.contains('search-open')));
document.querySelector('#site-nav').addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  else if (header.classList.contains('search-open')) { setSearch(false); searchBtn.focus(); }
});
document.addEventListener('submit', e => { if (e.target.id === 'search-form') setSearch(false); });
addEventListener('scroll', onScroll, {passive: true});
addEventListener('resize', () => { if (innerWidth >= 1240) setMenu(false); });
