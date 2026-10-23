// Estado de la aplicación. Carrito y favoritos viven en el navegador; el catálogo y la sesión vienen del servidor.
const KEY = 'animalworld-v2';
export const state = {catalog: {vendors: [], products: []}, user: null, cart: [], favorites: [], location: 'Maracay'};

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (Array.isArray(saved.cart)) state.cart = saved.cart.filter(i => i && typeof i.id === 'string' && Number.isInteger(i.qty) && i.qty > 0);
  if (Array.isArray(saved.favorites)) state.favorites = saved.favorites.filter(id => typeof id === 'string');
  if (typeof saved.location === 'string') state.location = saved.location;
} catch { /* almacenamiento no disponible: se trabaja solo en memoria */ }

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify({cart: state.cart, favorites: state.favorites, location: state.location})); } catch { /* sin almacenamiento */ }
  document.dispatchEvent(new CustomEvent('store:change'));
}

export const products = () => state.catalog.products;
export const productById = id => products().find(p => p.id === id);
export const vendorById = id => state.catalog.vendors.find(v => v.id === id);

export function cartLines() {
  return state.cart.map(i => ({...i, product: productById(i.id)})).filter(i => i.product);
}
export const subtotal = () => cartLines().reduce((a, i) => a + i.qty * i.product.price, 0);
export const cartCount = () => cartLines().reduce((a, i) => a + i.qty, 0);

// Quita del carrito lo que ya no existe y ajusta cantidades al stock disponible.
export function reconcileCart() {
  state.cart = cartLines()
    .map(i => ({id: i.id, qty: Math.min(i.qty, i.product.stock)}))
    .filter(i => i.qty > 0);
  save();
}
