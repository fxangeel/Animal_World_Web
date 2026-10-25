// Carrito, pedido y mensaje de WhatsApp.
import {CONFIG, waLink} from './config.js';
import {api, server} from './api.js';
import {state, save, cartLines, subtotal, productById, vendorById, reconcileCart} from './store.js';
import {icon, esc, money, bs, showModal, closeModal, toast} from './ui.js';

const CONTACT_KEY = 'animalworld-contact';
const readContact = () => { try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}'); } catch { return {}; } };
const writeContact = c => { try { localStorage.setItem(CONTACT_KEY, JSON.stringify(c)); } catch { /* sin almacenamiento */ } };
let lastRemoved = null;

export function addToCart(id) {
  const p = productById(id);
  if (!p) return;
  const line = state.cart.find(i => i.id === id);
  if ((line?.qty || 0) >= p.stock) { toast('No hay más unidades disponibles de este producto.'); return; }
  if (line) line.qty++; else state.cart.push({id, qty: 1});
  save();
  toast('Añadido a tu carrito ♥', {label: 'Ver carrito', name: 'cart'});
  document.querySelectorAll('#cart-count,#mobile-cart-count').forEach(el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
}

export function changeQuantity(id, delta) {
  const line = state.cart.find(i => i.id === id), p = productById(id);
  if (!line || !p) return;
  const next = line.qty + delta;
  if (next > p.stock) { toast('Llegaste al máximo disponible.'); return; }
  if (next <= 0) return removeFromCart(id);
  line.qty = next;
  save();
  showCart();
}

export function removeFromCart(id) {
  const line = state.cart.find(i => i.id === id);
  if (line) lastRemoved = {...line};
  state.cart = state.cart.filter(i => i.id !== id);
  save();
  showCart();
  if (line) toast('Producto eliminado', {label: 'Deshacer', name: 'undo-remove'});
}

export function undoRemove() {
  if (!lastRemoved) return;
  const p = productById(lastRemoved.id);
  if (p && !state.cart.some(i => i.id === lastRemoved.id)) state.cart.push({id: lastRemoved.id, qty: Math.min(lastRemoved.qty, p.stock)});
  lastRemoved = null;
  save();
  toast('Producto recuperado ♥');
  if (document.querySelector('#modal').classList.contains('drawer')) showCart();
}

// Agrupa las líneas del carrito por tienda vendedora.
function byVendor(lines) {
  const groups = new Map();
  for (const l of lines) {
    const key = l.product.vendor || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }
  return [...groups].map(([id, items]) => ({id, name: vendorById(id)?.name || items[0].product.vendorName || 'Tienda aliada', items}));
}

const bsLine = n => (bs(n) ? `<small class="bs-line">${bs(n)}</small>` : '');

export function showCart() {
  reconcileCart();
  const lines = cartLines();
  const groups = byVendor(lines);
  showModal(`<h2 class="modal-title">Tu carrito${lines.length ? ` <small class="cart-qty">${lines.reduce((a, l) => a + l.qty, 0)} ${lines.reduce((a, l) => a + l.qty, 0) === 1 ? 'producto' : 'productos'}</small>` : ''}</h2>${lines.length ? `
    ${groups.map(g => `<section class="cart-group" aria-label="Productos de ${esc(g.name)}">
      ${groups.length > 1 ? `<h3 class="cart-vendor">${icon('store')} ${esc(g.name)}</h3>` : ''}
      <ul class="cart-list">${g.items.map(i => `<li class="cart-item"><img src="${esc(i.product.images[0])}" alt="" width="60" height="72">
      <div><h3>${esc(i.product.name)}</h3><small>${esc(i.product.unit)} · ${money(i.product.price)}</small>
        <div class="quantity" role="group" aria-label="Cantidad de ${esc(i.product.name)}">
          <button data-action="quantity" data-id="${esc(i.id)}" data-delta="-1" aria-label="Quitar una unidad">${icon('minus')}</button><span aria-live="polite">${i.qty}</span>
          <button data-action="quantity" data-id="${esc(i.id)}" data-delta="1" aria-label="Añadir una unidad">${icon('plus')}</button></div></div>
      <div class="cart-line-total"><b>${money(i.qty * i.product.price)}</b><button class="remove" data-action="remove" data-id="${esc(i.id)}" aria-label="Eliminar ${esc(i.product.name)}">Eliminar</button></div></li>`).join('')}</ul></section>`).join('')}
    <div class="cart-summary">
      <div class="total-row grand-total"><span>Subtotal</span><span>${money(subtotal())}</span></div>
      ${bsLine(subtotal())}
      ${groups.length > 1 ? `<p class="subtle">Tu pedido incluye ${groups.length} tiendas. Va en un solo mensaje, separado por tienda, y cada una confirma lo suyo.</p>` : ''}
      <p class="subtle">La entrega o el retiro se elige en el siguiente paso.</p>
      <button class="button wide" data-action="checkout">Continuar con el pedido ${icon('arrow')}</button>
      <button class="link-button" data-action="close">Seguir comprando</button>
    </div>`
    : `<div class="empty">${icon('bag')}<h2>Tu carrito está vacío</h2><p>Añade tus favoritos para armar el pedido.</p><button class="button" data-action="shop">Explorar productos</button></div>`}`, 'Carrito');
}

export function showCheckout() {
  reconcileCart();
  if (!cartLines().length) return showCart();
  const user = state.user, saved = readContact();
  const city = saved.city || state.location, delivery = saved.delivery === 'pickup' ? 'pickup' : 'delivery';
  const pay = saved.payment || CONFIG.payments[0];
  const ship = delivery === 'pickup' ? 0 : CONFIG.shipping;
  showModal(`<h2 class="modal-title">Un paso más para consentirlo</h2>
    <ol class="steps-mini" aria-label="Progreso"><li class="done">Carrito</li><li class="now" aria-current="step">Tus datos</li><li>WhatsApp</li></ol>
    <p>Completa tus datos y te armamos el pedido para enviarlo por WhatsApp. No se cobra nada desde la web.${saved.name || saved.phone ? ' Recordamos tus datos de la última vez.' : ''}</p>
    <form id="checkout-form"><div class="form-grid">
      <div class="field"><label for="order-name">Nombre</label><input id="order-name" name="name" required maxlength="80" autocomplete="name" value="${esc(user?.name || saved.name || '')}"></div>
      <div class="field"><label for="order-phone">Teléfono</label><input id="order-phone" name="phone" type="tel" inputmode="tel" required maxlength="25" autocomplete="tel" placeholder="0412 000 0000" value="${esc(saved.phone || '')}"></div>
      <div class="field"><label for="order-city">Ciudad</label><select name="city" id="order-city">${CONFIG.cities.map(c => `<option ${city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="delivery">¿Cómo lo recibes?</label><select name="delivery" id="delivery"><option value="delivery" ${delivery === 'delivery' ? 'selected' : ''}>Entrega local · ${money(CONFIG.shipping)}</option><option value="pickup" ${delivery === 'pickup' ? 'selected' : ''}>Retiro coordinado · Sin costo</option></select></div></div>
      <div class="field" id="address-field" ${delivery === 'pickup' ? 'hidden' : ''}><label for="order-address">Dirección y punto de referencia</label><input id="order-address" name="address" ${delivery === 'pickup' ? '' : 'required'} maxlength="200" autocomplete="street-address" value="${esc(saved.address || '')}"></div>
      <div class="field"><label for="payment">Forma de pago preferida</label><select id="payment" name="payment">${CONFIG.payments.map(p => `<option ${p === pay ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      <div class="field"><label for="order-notes">Notas para la tienda <small>(opcional)</small></label><textarea id="order-notes" name="notes" maxlength="300" rows="2"></textarea></div>
      <div class="total-row"><span>Productos</span><span>${money(subtotal())}</span></div>
      <div class="total-row"><span>Entrega</span><span id="shipping-total">${money(ship)}</span></div>
      <div class="total-row grand-total"><span>Total</span><span id="checkout-total">${money(subtotal() + ship)}</span></div>
      ${bsLine(subtotal() + ship)}
      <p class="subtle">El pago y la entrega se acuerdan por WhatsApp al confirmar el pedido.</p>
      <button class="button wide" type="submit">Preparar mi pedido ${icon('arrow')}</button>
      <button class="link-button" type="button" data-action="cart">Volver al carrito</button></form>`, 'Datos del pedido');
}

export function updateDeliveryFields(isPickup) {
  document.querySelector('#address-field').hidden = isPickup;
  document.querySelector('#order-address').required = !isPickup;
  const ship = isPickup ? 0 : CONFIG.shipping;
  document.querySelector('#shipping-total').textContent = money(ship);
  document.querySelector('#checkout-total').textContent = money(subtotal() + ship);
}

export function orderMessage(o) {
  const groups = byVendor(o.items.map(i => ({...i, product: productById(i.id) || {vendor: '', vendorName: ''}})));
  const many = groups.length > 1;
  const lines = [
    'Hola, quiero hacer un pedido en Animal World 🐾',
    o.code ? `Pedido: ${o.code}` : null,
    '',
    'Productos:',
    ...groups.flatMap(g => [
      many ? `🏪 ${g.name}` : null,
      ...g.items.map(i => `• ${i.qty} × ${i.name} — ${money(i.price * i.qty)}`),
      many ? `   Subtotal ${g.name}: ${money(g.items.reduce((a, i) => a + i.price * i.qty, 0))}` : null
    ]),
    '',
    `Subtotal: ${money(o.subtotal)}`,
    `${o.delivery}: ${money(o.shipping)}`,
    `Total: ${money(o.total)}`,
    '',
    `Nombre: ${o.customer.name}`,
    `Teléfono: ${o.customer.phone}`,
    `Ciudad: ${o.customer.city}`,
    o.customer.address ? `Dirección: ${o.customer.address}` : null,
    `Pago preferido: ${o.payment}`,
    o.notes ? `Notas: ${o.notes}` : null
  ];
  return lines.filter(l => l !== null).join('\n');
}

export async function submitOrder(form) {
  const d = Object.fromEntries(new FormData(form));
  const pickup = d.delivery === 'pickup';
  const lines = cartLines();
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  let order;
  const customer = {name: d.name.trim(), phone: d.phone.trim(), city: d.city, address: pickup ? '' : (d.address || '').trim()};
  try {
    if (server.online) {
      const res = await api.post('/orders', {customer, delivery: d.delivery, payment: d.payment, notes: d.notes,
        items: lines.map(i => ({id: i.id, qty: i.qty}))});
      order = {...res.order, customer, notes: d.notes?.trim()};
    } else {
      const shipping = pickup ? 0 : CONFIG.shipping, sub = subtotal();
      order = {code: '', delivery: pickup ? 'Retiro coordinado' : 'Entrega local', payment: d.payment, customer, notes: d.notes?.trim(),
        subtotal: sub, shipping, total: sub + shipping, items: lines.map(i => ({id: i.id, name: i.product.name, price: i.product.price, qty: i.qty}))};
    }
  } catch (e) {
    button.disabled = false;
    toast(e.message);
    if (e.status === 409) { document.dispatchEvent(new CustomEvent('catalog:refresh')); }
    return;
  }
  writeContact({name: customer.name, phone: customer.phone, city: customer.city, address: customer.address || readContact().address || '', payment: d.payment, delivery: d.delivery});
  state.cart = [];
  save();
  document.dispatchEvent(new CustomEvent('catalog:refresh'));
  const message = orderMessage(order);
  showModal(`<div class="success-icon">${icon('check')}</div><h2 class="modal-title">¡Pedido listo para enviar!</h2>
    <ol class="steps-mini" aria-label="Progreso"><li class="done">Carrito</li><li class="done">Tus datos</li><li class="now" aria-current="step">WhatsApp</li></ol>
    ${order.code ? `<p>Tu código es <b>${esc(order.code)}</b>. Quedó registrado y falta un último paso:</p>` : '<p>Falta un último paso:</p>'}
    <p>Envía el mensaje por WhatsApp para que la tienda confirme disponibilidad, pago y entrega.</p>
    <pre class="wa-preview" tabindex="0" aria-label="Vista previa del mensaje">${esc(message)}</pre>
    <a class="button wa-button wide" href="${waLink(message)}" target="_blank" rel="noopener">Enviar pedido por WhatsApp ${icon('chat')}</a>
    <button class="button secondary wide" data-action="copy-order" data-message="${esc(message)}">Copiar mensaje</button>
    <button class="link-button" data-action="close">Cerrar</button>`, 'Pedido listo');
}
