// Vistas de la tienda: inicio, catálogo y ficha de producto.
import {CONFIG} from './config.js';
import {state, products, productById, vendorById} from './store.js';
import {icon, esc, money, normal, page} from './ui.js';
import {howItWorks, testimonials, faqPreview, storesStrip} from './content.js';

export function productCard(p) {
  const fav = state.favorites.includes(p.id);
  const out = p.stock <= 0;
  return `<article class="product">
    <a class="product-visual" href="#producto?id=${esc(p.id)}" aria-label="Ver ${esc(p.name)}" tabindex="-1">
      ${p.tag ? `<span class="tag ${p.old ? 'sale' : ''}">${esc(p.tag)}</span>` : ''}
      <img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy" width="220" height="210">
    </a>
    <button class="favorite ${fav ? 'active' : ''}" data-action="favorite" data-id="${esc(p.id)}" aria-pressed="${fav}"
      aria-label="${fav ? 'Quitar de' : 'Añadir a'} favoritos: ${esc(p.name)}">${icon('heart')}</button>
    <div class="product-info">
      <div class="product-brand">${esc(p.vendorName || vendorById(p.vendor)?.name || '')}</div>
      <h3><a href="#producto?id=${esc(p.id)}">${esc(p.name)}</a></h3>
      <div class="product-unit">${esc(p.unit)}</div>
      <div class="product-bottom">
        <div class="price-box"><span class="price">${money(p.price)}</span>${p.old ? `<span class="old-price">${money(p.old)}</span>` : ''}</div>
        <button class="add-button" data-action="add" data-id="${esc(p.id)}" ${out ? 'disabled' : ''}
          aria-label="${out ? 'Agotado' : 'Añadir'}: ${esc(p.name)}">${out ? 'Agotado' : `${icon('plus')}<span>Añadir</span>`}</button>
      </div>
    </div>
  </article>`;
}

function petTile(name, small, art) {
  const label = name === 'Pequeños' ? 'Pequeños amigos' : name;
  return `<a href="#catalogo?pet=${encodeURIComponent(name)}" class="pet-tile"><div class="pet-circle">${art}</div><strong>${label}</strong><small>${small}</small></a>`;
}

export function home() {
  const featured = products().slice(0, 4);
  return `<section class="hero-bg"><div class="wrap hero"><div>
      <div class="eyebrow">Para ellos, que lo son todo</div>
      <h1>Su pequeño mundo.<br>Todo nuestro <em>cariño.</em></h1>
      <p>Productos, cuidados y momentos felices para tu mascota, de comercios locales de Aragua y en un solo pedido.</p>
      <div class="button-row"><a href="#catalogo" class="button">Explorar productos ${icon('arrow')}</a><a href="#servicios" class="button secondary">Descubrir servicios</a></div>
      <div class="hero-note">${icon('pin')} Una comunidad local. Un mundo de posibilidades.</div>
    </div>
    <div class="hero-visual"><img class="hero-image" src="assets/hero-dog.jpg" alt="Golden retriever disfrutando un día al aire libre" fetchpriority="high" width="560" height="430">
      <div class="hero-sticker">Pequeñas patas.<b>Gran amor.</b>♥</div>
      <div class="hero-card"><span class="heart-bubble">${icon('heart')}</span><div><b>Su felicidad nos mueve</b><small>Conectamos Aragua, una huella a la vez.</small></div></div>
    </div></div></section>
  <div class="wrap benefits">${[
    ['truck', 'Entrega local', 'Opciones para tu zona'],
    ['chat', 'Pide por WhatsApp', 'Tu pedido llega ya armado'],
    ['card', 'Paga a tu manera', 'Pago Móvil, Binance y más'],
    ['heart', 'Para todas las mascotas', 'De las patitas a las aletas']
  ].map(([i, t, s]) => `<div class="benefit">${icon(i)}<div><b>${t}</b><span>${s}</span></div></div>`).join('')}</div>
  <section class="wrap section" aria-labelledby="h-pets"><div class="section-head"><div><h2 id="h-pets">¿A quién vamos a consentir?</h2><p>Cada mascota tiene su mundo. Aquí hay algo para el suyo.</p></div><a href="#catalogo" class="text-link">Ver todo <span>↗</span></a></div>
    <div class="pets-grid">
      ${petTile('Perros', 'Lealtad con cuatro patas', '<img src="assets/hero-dog.jpg" alt="" loading="lazy" width="124" height="124">')}
      ${petTile('Gatos', 'Dueños de la casa', '<img src="assets/cat.jpg" alt="" loading="lazy" width="124" height="124">')}
      ${petTile('Aves', 'Alegría que vuela', icon('bird'))}
      ${petTile('Peces', 'Un mundo bajo el agua', icon('fish'))}
      ${petTile('Pequeños', 'Pequeños, pero enormes', icon('rabbit'))}
      ${petTile('Reptiles', 'Amigos extraordinarios', icon('turtle'))}
    </div></section>
  <section class="wrap section" aria-labelledby="h-fav"><div class="section-head"><div><div class="eyebrow">Pequeños favoritos</div><h2 id="h-fav">Para llenar su día de alegría</h2><p>Una selección pensada para comer, jugar y estar bien.</p></div><a href="#catalogo" class="text-link">Ver catálogo <span>↗</span></a></div>
    <div class="products-grid">${featured.map(productCard).join('')}</div></section>
  ${howItWorks()}
  ${storesStrip()}
  ${testimonials()}
  ${faqPreview()}
  <section class="wrap local-banner"><div><div class="eyebrow">Juntos dejamos más huellas</div><h2>¿Tienes un negocio para mascotas?</h2><p>Publica tus productos y servicios bajo Animal World y llega a más hogares de Aragua. Crezcamos juntos.</p></div><a href="#afiliate" class="button light">Quiero ser parte ${icon('arrow')}</a></section>
  <section class="newsletter"><div class="wrap"><div><h2>Buenas noticias para sus patitas.</h2><p>Recibe novedades y consejos. Sin spam, te puedes dar de baja cuando quieras.</p></div>
    <form id="newsletter-form"><label class="sr-only" for="newsletter-email">Tu correo electrónico</label><input id="newsletter-email" name="email" type="email" placeholder="Tu correo electrónico" required maxlength="120" autocomplete="email"><button class="button" type="submit">Quiero enterarme</button></form></div></section>`;
}

// ---------- Catálogo ----------
export function filterProducts(params, favoritesOnly = false) {
  const pet = params.get('pet') || '', category = params.get('category') || '', vendor = params.get('vendor') || '';
  const q = normal(params.get('q') || '').trim(), sort = params.get('sort') || 'featured', range = params.get('price') || '';
  const [lo, hi] = range ? range.split('-').map(v => (v === '' ? null : Number(v))) : [null, null];
  const words = q.split(/\s+/).filter(Boolean);
  const list = products().filter(p => {
    if (pet && p.pet !== pet) return false;
    if (category && p.category !== category) return false;
    if (vendor && p.vendor !== vendor) return false;
    if (lo !== null && p.price < lo) return false;
    if (hi !== null && hi !== undefined && p.price > hi) return false;
    if (favoritesOnly && !state.favorites.includes(p.id)) return false;
    if (words.length) {
      const hay = normal(`${p.name} ${p.brand} ${p.category} ${p.pet} ${p.vendorName || ''} ${p.short || ''}`);
      return words.every(w => hay.includes(w));
    }
    return true;
  });
  if (sort === 'asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'desc') list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return list;
}

const radioGroup = (title, name, options, current) => `<fieldset class="filter-group"><legend>${title}</legend>${options.map(([v, t]) =>
  `<label><input type="radio" name="${name}" value="${esc(v)}" ${v === current ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset>`;

export function resultsHtml(list, params, favoritesOnly) {
  const q = params.get('q') || '';
  const grid = list.length
    ? list.map(productCard).join('')
    : `<div class="empty">${icon(favoritesOnly ? 'heart' : 'search')}<h2>${favoritesOnly ? 'Aquí van sus próximos favoritos' : 'No encontramos coincidencias'}</h2>
       <p>${favoritesOnly ? 'Guarda los productos que te gustan tocando el corazón.' : 'Prueba con otra búsqueda o quita algún filtro.'}</p><a href="#${favoritesOnly ? 'catalogo' : 'catalogo'}" class="button">Ver todo el catálogo</a></div>`;
  return {
    count: `${list.length} producto${list.length === 1 ? '' : 's'}${q ? ` para «${esc(q)}»` : ''}`,
    grid
  };
}

export function catalog(params, favoritesOnly = false) {
  const list = filterProducts(params, favoritesOnly);
  const sort = params.get('sort') || 'featured';
  const vendors = state.catalog.vendors;
  const {count, grid} = resultsHtml(list, params, favoritesOnly);
  const active = ['pet', 'category', 'vendor', 'price'].some(k => params.get(k));
  return page(favoritesOnly ? 'Tus favoritos' : 'Un mundo para tu mascota',
    favoritesOnly ? 'Esas pequeñas cosas que sabes que le van a encantar.' : 'Alimento, juguetes y cuidados de tiendas locales. Encuentra su próximo favorito.',
    `<div class="catalog-layout">
      <aside class="filters" id="catalog-filters" aria-label="Filtros de productos">
        ${radioGroup('Tu mascota', 'pet', [['', 'Todas'], ...CONFIG.pets.map(v => [v, v === 'Pequeños' ? 'Pequeños amigos' : v])], params.get('pet') || '')}
        ${radioGroup('¿Qué necesita?', 'category', [['', 'Todo'], ...CONFIG.categories.map(v => [v, v])], params.get('category') || '')}
        ${radioGroup('Precio', 'price', [['', 'Cualquiera'], ...CONFIG.priceRanges], params.get('price') || '')}
        ${vendors.length > 1 ? radioGroup('Tienda', 'vendor', [['', 'Todas'], ...vendors.map(v => [v.id, v.name])], params.get('vendor') || '') : ''}
        ${active || params.get('q') ? '<button class="clear-button" data-action="clear-filters">Limpiar filtros</button>' : ''}
      </aside>
      <div>
        <div class="catalog-toolbar"><span id="result-count" role="status" aria-live="polite">${count}</span>
          <label>Ordenar por <select id="sort">${[['featured', 'Recomendados'], ['asc', 'Menor precio'], ['desc', 'Mayor precio'], ['name', 'Nombre: A a Z']].map(([v, t]) =>
            `<option value="${v}" ${sort === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
        <div class="products-grid" id="results">${grid}</div>
      </div>
    </div>`, favoritesOnly ? 'Favoritos' : 'Catálogo');
}

// ---------- Ficha de producto ----------
function related(p) {
  const score = o => (o.pet === p.pet ? 2 : 0) + (o.category === p.category ? 1 : 0);
  return products().filter(o => o.id !== p.id && score(o) > 0).sort((a, b) => score(b) - score(a)).slice(0, 4);
}

export function productPage(params) {
  const p = productById(params.get('id'));
  if (!p) return page('Producto no disponible', 'Es posible que ya no esté en el catálogo.', '<a href="#catalogo" class="button">Volver al catálogo</a>', 'Producto');
  const vendor = vendorById(p.vendor);
  const fav = state.favorites.includes(p.id);
  const stockText = p.stock <= 0 ? 'Agotado por ahora' : p.stock <= 5 ? `Quedan pocas unidades (${p.stock})` : 'Disponible';
  const rel = related(p);
  return page(esc(p.name), '', `<div class="product-detail">
      <div class="gallery">
        <div class="gallery-main"><img id="gallery-main" src="${esc(p.images[0])}" alt="${esc(p.name)}" width="600" height="560" fetchpriority="high"></div>
        ${p.images.length > 1 ? `<div class="gallery-thumbs" role="group" aria-label="Más imágenes">${p.images.map((src, i) =>
          `<button class="thumb ${i === 0 ? 'active' : ''}" data-action="gallery" data-src="${esc(src)}" aria-label="Ver imagen ${i + 1} de ${p.images.length}" aria-pressed="${i === 0}"><img src="${esc(src)}" alt="" loading="lazy" width="72" height="72"></button>`).join('')}</div>` : ''}
      </div>
      <div class="detail-info">
        <div class="eyebrow">${esc(p.brand)}</div>
        <h2>${esc(p.name)}</h2>
        <p class="detail-unit">${esc(p.unit)}${vendor ? ` · Vende <a href="#catalogo?vendor=${esc(vendor.id)}">${esc(vendor.name)}</a>${vendor.city ? ` (${esc(vendor.city)})` : ''}` : ''}</p>
        <div class="detail-price"><span class="price">${money(p.price)}</span>${p.old ? `<span class="old-price">${money(p.old)}</span>` : ''}</div>
        <p class="stock-message ${p.stock <= 0 ? 'out' : ''}">${stockText}</p>
        <p class="detail-short">${esc(p.short || '')}</p>
        <div class="button-row">
          <button class="button" data-action="add" data-id="${esc(p.id)}" ${p.stock <= 0 ? 'disabled' : ''}>Añadir al carrito ${icon('bag')}</button>
          <button class="button secondary" data-action="favorite" data-id="${esc(p.id)}" aria-pressed="${fav}">${fav ? 'Quitar de favoritos' : 'Guardar favorito'} ${icon('heart')}</button>
        </div>
        <details class="detail-more" open><summary>Descripción</summary><p>${esc(p.description || p.short || '')}</p></details>
        <details class="detail-more"><summary>Entrega y retiro</summary><p>Elige entrega local (${money(CONFIG.shipping)}) o retiro coordinado al hacer tu pedido. La tienda confirma disponibilidad y coordina la entrega contigo por WhatsApp.</p></details>
        <button class="link-button" data-action="ask-product" data-id="${esc(p.id)}">${icon('chat')} Preguntar por este producto</button>
      </div>
    </div>
    ${rel.length ? `<section class="section" aria-labelledby="h-rel"><div class="section-head"><h2 id="h-rel">También te puede gustar</h2></div><div class="products-grid">${rel.map(productCard).join('')}</div></section>` : ''}`,
    'Producto').replace('class="page-title"', 'class="page-title sr-only"');
}
