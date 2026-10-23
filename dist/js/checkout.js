// Carrito, pedido y mensaje de WhatsApp.
import {CONFIG, waLink} from './config.js';
import {api, server} from './api.js';
import {state, save, cartLines, subtotal, productById, reconcileCart} from './store.js';
import {icon, esc, money, showModal, closeModal, toast} from './ui.js';

export function addToCart(id) {
  const p = productById(id);
  if (!p) return;
  const line = state.cart.find(i => i.id === id);
  if ((line?.qty || 0) >= p.stock) { toast('No hay más unidades disponibles de este producto.'); return; }
  if (line) line.qty++; else state.cart.push({id, qty: 1});
  save();
  toast('Añadido a tu carrito ♥');
}

export function changeQuantity(id, delta) {
  const line = state.cart.find(i => i.id === id), p = productById(id);
  if (!line || !p) return;
  const next = line.qty + delta;
  if (next > p.stock) { toast('Llegaste al máximo disponible.'); return; }
  if (next <= 0) state.cart = state.cart.filter(i => i.id !== id); else line.qty = next;
  save();
  showCart();
}
export function removeFromCart(id) { state.cart = state.cart.filter(i => i.id !== id); save(); showCart(); }

export function showCart() {
  reconcileCart();
  const lines = cartLines();
  showModal(`<h2 class="modal-title">Tu carrito</h2>${lines.length ? `
    <ul class="cart-list">${lines.map(i => `<li class="cart-item"><img src="${esc(i.product.images[0])}" alt="" width="60" height="72">
      <div><h3>${esc(i.product.name)}</h3><small>${esc(i.product.unit)} · ${money(i.product.price)}</small>
        <div class="quantity" role="group" aria-label="Cantidad de ${esc(i.product.name)}">
          <button data-action="quantity" data-id="${esc(i.id)}" data-delta="-1" aria-label="Quitar una unidad">${icon('minus')}</button><span aria-live="polite">${i.qty}</span>
          <button data-action="quantity" data-id="${esc(i.id)}" data-delta="1" aria-label="Añadir una unidad">${icon('plus')}</button></div></div>
      <div class="cart-line-total"><b>${money(i.qty * i.product.price)}</b><button class="remove" data-action="remove" data-id="${esc(i.id)}">Eliminar</button></div></li>`).join('')}</ul>
    <div class="total-row grand-total"><span>Subtotal</span><span>${money(subtotal())}</span></div>
    <p class="subtle">La entrega o el retiro se elige en el siguiente paso.</p>
    <button class="button wide" data-action="checkout">Continuar con el pedido ${icon('arrow')}</button>`
    : `<div class="empty">${icon('bag')}<h2>Tu carrito está vacío</h2><p>Añade tus favoritos para armar el pedido.</p><button class="button" data-action="shop">Explorar productos</button></div>`}`, 'Carrito');
}

export function showCheckout() {
  reconcileCart();
  if (!cartLines().length) return showCart();
  const user = state.user;
  showModal(`<h2 class="modal-title">Un paso más para consentirlo</h2>
    <p>Completa tus datos y te armamos el pedido para enviarlo por WhatsApp. No se cobra nada desde la web.</p>
    <form id="checkout-form"><div class="form-grid">
      <div class="field"><label for="order-name">Nombre</label><input id="order-name" name="name" required maxlength="80" autocomplete="name" value="${esc(user?.name || '')}"></div>
      <div class="field"><label for="order-phone">Teléfono</label><input id="order-phone" name="phone" type="tel" required maxlength="25" autocomplete="tel" placeholder="0412 000 0000"></div>
      <div class="field"><label for="order-city">Ciudad</label><select name="city" id="order-city">${CONFIG.cities.map(c => `<option ${state.location === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="delivery">¿Cómo lo recibes?</label><select name="delivery" id="delivery"><option value="delivery">Entrega local · ${money(CONFIG.shipping)}</option><option value="pickup">Retiro coordinado · Sin costo</option></select></div></div>
      <div class="field" id="address-field"><label for="order-address">Dirección y punto de referencia</label><input id="order-address" name="address" required maxlength="200" autocomplete="street-address"></div>
      <div class="field"><label for="payment">Forma de pago preferida</label><select id="payment" name="payment">${CONFIG.payments.map(p => `<option>${p}</option>`).join('')}</select></div>
      <div class="field"><label for="order-notes">Notas para la tienda <small>(opcional)</small></label><textarea id="order-notes" name="notes" maxlength="300" rows="2"></textarea></div>
      <div class="total-row"><span>Productos</span><span>${money(subtotal())}</span></div>
      <div class="total-row"><span>Entrega</span><span id="shipping-total">${money(CONFIG.shipping)}</span></div>
      <div class="total-row grand-total"><span>Total</span><span id="checkout-total">${money(subtotal() + CONFIG.shipping)}</span></div>
      <p class="subtle">El pago y la entrega se acuerdan por WhatsApp al confirmar el pedido.</p>
      <button class="button wide" type="submit">Preparar mi pedido ${icon('arrow')}</button></form>`, 'Datos del pedido');
}

export function updateDeliveryFields(isPickup) {
  document.querySelector('#address-field').hidden = isPickup;
  document.querySelector('#order-address').required = !isPickup;
  const ship = isPickup ? 0 : CONFIG.shipping;
  document.querySelector('#shipping-total').textContent = money(ship);
  document.querySelector('#checkout-total').textContent = money(subtotal() + ship);
}

export function orderMessage(o) {
  const lines = [
    'Hola, quiero hacer un pedido en Animal World 🐾',
    o.code ? `Pedido: ${o.code}` : null,
    '',
    'Productos:',
    ...o.items.map(i => `• ${i.qty} × ${i.name} — ${money(i.price * i.qty)}`),
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
  state.cart = [];
  save();
  document.dispatchEvent(new CustomEvent('catalog:refresh'));
  const message = orderMessage(order);
  showModal(`<div class="success-icon">${icon('check')}</div><h2 class="modal-title">¡Pedido listo para enviar!</h2>
    ${order.code ? `<p>Tu código es <b>${esc(order.code)}</b>. Quedó registrado y falta un último paso:</p>` : '<p>Falta un último paso:</p>'}
    <p>Envía el mensaje por WhatsApp para que la tienda confirme disponibilidad, pago y entrega.</p>
    <pre class="wa-preview" tabindex="0" aria-label="Vista previa del mensaje">${esc(message)}</pre>
    <a class="button wa-button wide" href="${waLink(message)}" target="_blank" rel="noopener">Enviar pedido por WhatsApp ${icon('chat')}</a>
    <button class="button secondary wide" data-action="copy-order" data-message="${esc(message)}">Copiar mensaje</button>
    <button class="link-button" data-action="close">Cerrar</button>`, 'Pedido listo');
}
