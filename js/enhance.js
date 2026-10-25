// Mejoras transversales: modo oscuro, datos estructurados por página, app instalable (PWA) y aviso sin conexión.
import {productById, vendorById} from './store.js';
import {icon, toast} from './ui.js';

// ---------- Modo oscuro ----------
const themeBtn = document.querySelector('#theme-toggle');
function paintTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeBtn.innerHTML = icon(dark ? 'sun' : 'moon');
  themeBtn.setAttribute('aria-pressed', String(dark));
  themeBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#16245f' : '#2f63e8');
}
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('animalworld-theme', next); } catch { /* sin almacenamiento */ }
  paintTheme();
});
paintTheme();

// ---------- Datos estructurados (JSON-LD) por página ----------
const abs = path => new URL(path, document.baseURI).href;
export function structuredData(path, params) {
  const graph = [];
  if (path === 'producto') {
    const p = productById(params.get('id'));
    if (p) {
      const v = vendorById(p.vendor);
      graph.push({
        '@type': 'Product', name: p.name, description: p.description || p.short || p.name,
        image: p.images.map(abs), brand: {'@type': 'Brand', name: p.brand || 'Animal World'}, category: p.category,
        offers: {
          '@type': 'Offer', price: p.price.toFixed(2), priceCurrency: 'USD', url: location.href,
          availability: `https://schema.org/${p.stock > 0 ? 'InStock' : 'OutOfStock'}`,
          ...(v ? {seller: {'@type': 'Organization', name: v.name}} : {})
        }
      });
      graph.push(crumbs([['Inicio', '#inicio'], ['Catálogo', '#catalogo'], [p.name, location.hash]]));
    }
  } else if (path === 'tienda') {
    const v = vendorById(params.get('id'));
    if (v) {
      graph.push({'@type': 'Store', name: v.name, description: v.about || undefined, address: {'@type': 'PostalAddress', addressLocality: v.city || 'Maracay', addressRegion: 'Aragua', addressCountry: 'VE'}});
      graph.push(crumbs([['Inicio', '#inicio'], [v.name, location.hash]]));
    }
  } else if (path !== 'inicio' && path) {
    graph.push(crumbs([['Inicio', '#inicio'], [document.title.split(' · ')[0], location.hash]]));
  }
  let el = document.querySelector('#ld-page');
  if (!graph.length) { el?.remove(); return; }
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ld-page'; document.head.append(el); }
  el.textContent = JSON.stringify({'@context': 'https://schema.org', '@graph': graph});
}
const crumbs = items => ({'@type': 'BreadcrumbList', itemListElement: items.map(([name, hash], i) => ({'@type': 'ListItem', position: i + 1, name, item: abs(hash)}))});

// ---------- PWA ----------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* sin service worker la tienda funciona igual */ }));
}
let installEvent = null;
const installBtn = document.querySelector('#install-app');
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; installBtn.hidden = false; });
installBtn.addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice.catch(() => {});
  installEvent = null;
  installBtn.hidden = true;
});
addEventListener('appinstalled', () => { installBtn.hidden = true; toast('¡Animal World instalada!'); });

// ---------- Sin conexión ----------
const offline = document.createElement('div');
offline.className = 'offline-bar';
offline.setAttribute('role', 'status');
offline.textContent = 'Sin conexión: puedes seguir viendo el catálogo. Los pedidos y las cuentas necesitan internet.';
offline.hidden = navigator.onLine;
document.body.prepend(offline);
addEventListener('offline', () => { offline.hidden = false; });
addEventListener('online', () => { offline.hidden = true; toast('Conexión recuperada'); document.dispatchEvent(new CustomEvent('catalog:refresh')); });

// ---------- WhatsApp compacto sobre el hero ----------
const wa = document.querySelector('#wa-float');
const paintWa = () => wa.classList.toggle('at-top', scrollY < 40);
addEventListener('scroll', paintWa, {passive: true});
paintWa();
