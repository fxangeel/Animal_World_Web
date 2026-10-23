// API de Animal World (Cloudflare Pages Functions + D1). Un solo enrutador, rutas bajo /api/.
import {
  HttpError, json, body, text, email, phone, int, oneOf, randomHex, hashPassword, timingSafeEqual,
  checkPassword, createSession, clearCookie, currentUser, destroySession, rateLimit, clearLimit, requireRole
} from '../_lib/core.js';

const PETS = ['Perros', 'Gatos', 'Aves', 'Peces', 'Pequeños', 'Reptiles'];
const CATEGORIES = ['Alimentos', 'Juguetes', 'Accesorios', 'Higiene', 'Cuidado'];
const CITIES = ['Maracay', 'Turmero', 'Cagua', 'La Victoria', 'Otra zona de Aragua'];
const ORDER_STATUS = ['Recibido', 'Confirmado', 'En preparación', 'En camino', 'Entregado', 'Cancelado'];
const ITEM_STATUS = ['Pendiente', 'Preparado'];
const PAYMENTS = ['Pago Móvil', 'Binance', 'Tarjeta (a coordinar)'];
const SERVICES = ['Baño y peluquería', 'Consulta veterinaria', 'Paseos con compañía', 'Cuidado y hospedaje', 'Entrega de alimento recurrente', 'Orientación de cuidado'];

const publicProduct = r => ({
  id: r.id, vendor: r.vendor_id, vendorName: r.vendor_name, name: r.name, brand: r.brand, pet: r.pet, category: r.category,
  price: r.price_cents / 100, old: r.old_price_cents ? r.old_price_cents / 100 : null, unit: r.unit, tag: r.tag,
  stock: r.stock, short: r.short, description: r.description, images: JSON.parse(r.images || '[]')
});
const money = c => c / 100;

const routes = [];
const route = (method, pattern, handler) => routes.push({method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler});

// ---------- Catálogo público ----------
route('GET', '/catalog', async ({db}) => {
  const [vendors, products] = await db.batch([
    db.prepare(`SELECT id,name,city,about FROM vendors WHERE status='active' ORDER BY name`),
    db.prepare(`SELECT p.*, v.name AS vendor_name FROM products p JOIN vendors v ON v.id=p.vendor_id
      WHERE p.status='approved' AND v.status='active' ORDER BY p.created_at, p.id`)
  ]);
  // Sin caché: las existencias deben reflejar de inmediato compras y cambios de la tienda.
  return json({vendors: vendors.results, products: products.results.map(publicProduct)});
});

// ---------- Cuentas ----------
const userOut = u => ({id: u.id, name: u.name, email: u.email, role: u.role, vendorId: u.vendor_id, mustChange: !!u.must_change});

route('GET', '/me', async ({user}) => json({user: user ? userOut(user) : null}));

route('POST', '/auth/register', async ({db, request}) => {
  const d = await body(request);
  const name = text(d.name, 'Nombre', {max: 80}), mail = email(d.email), pass = checkPassword(d.password);
  if (await db.prepare('SELECT 1 FROM users WHERE email=?').bind(mail).first()) throw new HttpError(409, 'Ese correo ya tiene una cuenta.');
  const {hash, salt} = await hashPassword(pass);
  const res = await db.prepare(`INSERT INTO users(email,name,pass_hash,pass_salt,role) VALUES(?,?,?,?, 'customer')`).bind(mail, name, hash, salt).run();
  const cookie = await createSession(db, res.meta.last_row_id, request);
  return json({user: {id: res.meta.last_row_id, name, email: mail, role: 'customer', vendorId: null, mustChange: false}}, 201, {'set-cookie': cookie});
});

route('POST', '/auth/login', async ({db, request}) => {
  const d = await body(request);
  const mail = email(d.email);
  const key = `${mail}|${request.headers.get('cf-connecting-ip') || 'local'}`;
  await rateLimit(db, key);
  const u = await db.prepare('SELECT * FROM users WHERE email=?').bind(mail).first();
  // Se calcula el hash aunque el usuario no exista para no revelar qué correos están registrados.
  const {hash} = await hashPassword(typeof d.password === 'string' ? d.password.slice(0, 100) : '', u ? u.pass_salt : randomHex(16));
  if (!u || !timingSafeEqual(hash, u.pass_hash)) throw new HttpError(401, 'Correo o contraseña incorrectos.');
  await clearLimit(db, key);
  return json({user: userOut(u)}, 200, {'set-cookie': await createSession(db, u.id, request)});
});

route('POST', '/auth/logout', async ({db, request}) => {
  await destroySession(db, request);
  return json({ok: true}, 200, {'set-cookie': clearCookie()});
});

route('POST', '/auth/password', async ({db, request, user}) => {
  requireRole(user, 'customer', 'vendor', 'admin');
  const d = await body(request);
  const u = await db.prepare('SELECT * FROM users WHERE id=?').bind(user.id).first();
  const {hash: current} = await hashPassword(String(d.current || '').slice(0, 100), u.pass_salt);
  if (!timingSafeEqual(current, u.pass_hash)) throw new HttpError(401, 'La contraseña actual no es correcta.');
  const {hash, salt} = await hashPassword(checkPassword(d.password));
  await db.batch([
    db.prepare('UPDATE users SET pass_hash=?, pass_salt=?, must_change=0 WHERE id=?').bind(hash, salt, user.id),
    db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)
  ]);
  return json({ok: true}, 200, {'set-cookie': await createSession(db, user.id, request)});
});

// ---------- Pedidos ----------
function orderCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'AW-' + [...crypto.getRandomValues(new Uint8Array(6))].map(b => alphabet[b % alphabet.length]).join('');
}

route('POST', '/orders', async ({db, request, user, env}) => {
  const d = await body(request);
  const c = d.customer || {};
  const delivery = oneOf(d.delivery, ['delivery', 'pickup'], 'Entrega');
  const customer = {
    name: text(c.name, 'Nombre', {max: 80}), phone: phone(c.phone),
    city: oneOf(c.city, CITIES, 'Ciudad'),
    address: delivery === 'delivery' ? text(c.address, 'Dirección', {max: 200}) : ''
  };
  const payment = oneOf(d.payment, PAYMENTS, 'Forma de pago');
  const notes = text(d.notes, 'Notas', {max: 300, optional: true});
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 30) throw new HttpError(400, 'El pedido no tiene productos.');

  const merged = new Map();
  for (const i of d.items) merged.set(String(i.id), (merged.get(String(i.id)) || 0) + int(i.qty, 'Cantidad', {min: 1, max: 99}));
  const ids = [...merged.keys()];
  const rows = (await db.prepare(`SELECT id,vendor_id,name,price_cents,stock FROM products WHERE status='approved' AND id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all()).results;
  if (rows.length !== ids.length) throw new HttpError(409, 'Algún producto ya no está disponible. Actualiza tu carrito.');
  for (const r of rows) if (merged.get(r.id) > r.stock) throw new HttpError(409, `No hay suficientes unidades de «${r.name}».`);

  const subtotal = rows.reduce((a, r) => a + r.price_cents * merged.get(r.id), 0);
  const shipping = delivery === 'delivery' ? Number(env.SHIPPING_CENTS || 0) : 0;
  const code = orderCode();
  const stmts = [
    db.prepare(`INSERT INTO orders(code,user_id,customer_name,phone,city,address,delivery,payment,notes,subtotal_cents,shipping_cents,total_cents)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(code, user?.id ?? null, customer.name, customer.phone, customer.city, customer.address,
      delivery === 'pickup' ? 'Retiro coordinado' : 'Entrega local', payment, notes, subtotal, shipping, subtotal + shipping),
    ...rows.map(r => db.prepare(`INSERT INTO order_items(order_id,product_id,vendor_id,name,unit_price_cents,qty)
      VALUES((SELECT id FROM orders WHERE code=?),?,?,?,?,?)`).bind(code, r.id, r.vendor_id, r.name, r.price_cents, merged.get(r.id))),
    // El CHECK (stock >= 0) hace fallar y revertir todo el lote si otra compra se adelantó.
    ...rows.map(r => db.prepare('UPDATE products SET stock=stock-? WHERE id=?').bind(merged.get(r.id), r.id))
  ];
  try { await db.batch(stmts); } catch { throw new HttpError(409, 'Se agotó alguna unidad mientras comprabas. Actualiza tu carrito.'); }
  return json({
    order: {
      code, delivery: delivery === 'pickup' ? 'Retiro coordinado' : 'Entrega local', payment, city: customer.city,
      subtotal: money(subtotal), shipping: money(shipping), total: money(subtotal + shipping),
      items: rows.map(r => ({id: r.id, name: r.name, price: money(r.price_cents), qty: merged.get(r.id)}))
    }
  }, 201);
});

async function ordersFor(db, user) {
  let orders;
  if (user.role === 'admin') orders = (await db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 200').all()).results;
  else if (user.role === 'vendor') orders = (await db.prepare(`SELECT DISTINCT o.* FROM orders o JOIN order_items i ON i.order_id=o.id
    WHERE i.vendor_id=? ORDER BY o.id DESC LIMIT 200`).bind(user.vendor_id).all()).results;
  else orders = (await db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(user.id).all()).results;
  if (!orders.length) return [];
  const ids = orders.map(o => o.id);
  const marks = ids.map(() => '?').join(',');
  const vendorOnly = user.role === 'vendor' ? ' AND vendor_id=?' : '';
  const binds = user.role === 'vendor' ? [...ids, user.vendor_id] : ids;
  const items = (await db.prepare(`SELECT * FROM order_items WHERE order_id IN (${marks})${vendorOnly}`).bind(...binds).all()).results;
  return orders.map(o => {
    const mine = items.filter(i => i.order_id === o.id);
    const out = {
      code: o.code, status: o.status, date: o.created_at, delivery: o.delivery, payment: o.payment, city: o.city,
      subtotal: money(o.subtotal_cents), shipping: money(o.shipping_cents), total: money(o.total_cents),
      items: mine.map(i => ({id: i.id, name: i.name, price: money(i.unit_price_cents), qty: i.qty, status: i.item_status}))
    };
    // Los datos de contacto del cliente solo los ven el administrador y las tiendas con productos en el pedido.
    if (user.role !== 'customer') Object.assign(out, {customer: o.customer_name, phone: o.phone, address: o.address, notes: o.notes});
    return out;
  });
}
route('GET', '/orders', async ({db, user}) => json({orders: await ordersFor(db, requireRole(user, 'customer', 'vendor', 'admin'))}));

route('PATCH', '/orders/:code', async ({db, request, user, params}) => {
  requireRole(user, 'admin');
  const status = oneOf((await body(request)).status, ORDER_STATUS, 'Estado');
  const o = await db.prepare('SELECT id,status FROM orders WHERE code=?').bind(params.code).first();
  if (!o) throw new HttpError(404, 'Pedido no encontrado.');
  const stmts = [db.prepare('UPDATE orders SET status=? WHERE id=?').bind(status, o.id)];
  // Al cancelar se devuelve el stock; al reactivar un pedido cancelado se vuelve a descontar.
  if (status === 'Cancelado' && o.status !== 'Cancelado')
    stmts.push(db.prepare(`UPDATE products SET stock=stock+(SELECT COALESCE(SUM(qty),0) FROM order_items WHERE order_id=? AND product_id=products.id)
      WHERE id IN (SELECT product_id FROM order_items WHERE order_id=?)`).bind(o.id, o.id));
  if (o.status === 'Cancelado' && status !== 'Cancelado')
    stmts.push(db.prepare(`UPDATE products SET stock=stock-(SELECT COALESCE(SUM(qty),0) FROM order_items WHERE order_id=? AND product_id=products.id)
      WHERE id IN (SELECT product_id FROM order_items WHERE order_id=?)`).bind(o.id, o.id));
  try { await db.batch(stmts); } catch { throw new HttpError(409, 'No hay stock suficiente para reactivar el pedido.'); }
  return json({ok: true});
});

route('PATCH', '/order-items/:id', async ({db, request, user, params}) => {
  requireRole(user, 'vendor', 'admin');
  const status = oneOf((await body(request)).status, ITEM_STATUS, 'Estado');
  const scope = user.role === 'vendor' ? ' AND vendor_id=?' : '';
  const binds = user.role === 'vendor' ? [status, params.id, user.vendor_id] : [status, params.id];
  const res = await db.prepare(`UPDATE order_items SET item_status=? WHERE id=?${scope}`).bind(...binds).run();
  if (!res.meta.changes) throw new HttpError(404, 'Artículo no encontrado.');
  return json({ok: true});
});

// ---------- Formularios públicos ----------
route('POST', '/affiliates', async ({db, request}) => {
  const d = await body(request);
  await db.prepare('INSERT INTO affiliate_requests(business,name,phone,email,city,type) VALUES(?,?,?,?,?,?)').bind(
    text(d.business, 'Comercio', {max: 100}), text(d.name, 'Persona de contacto', {max: 80}), phone(d.phone), email(d.email),
    oneOf(d.city, CITIES, 'Ciudad'), oneOf(d.type, ['Productos', 'Servicios', 'Productos y servicios'], 'Tipo')).run();
  return json({ok: true}, 201);
});
route('POST', '/service-requests', async ({db, request}) => {
  const d = await body(request);
  await db.prepare('INSERT INTO service_requests(service,name,pet,phone,preferred_date) VALUES(?,?,?,?,?)').bind(
    oneOf(d.service, SERVICES, 'Servicio'), text(d.name, 'Nombre', {max: 80}), text(d.pet, 'Mascota', {max: 80}), phone(d.phone),
    text(d.date, 'Fecha', {max: 10, optional: true})).run();
  return json({ok: true}, 201);
});
route('POST', '/messages', async ({db, request}) => {
  const d = await body(request);
  await db.prepare('INSERT INTO messages(name,email,topic,message) VALUES(?,?,?,?)').bind(
    text(d.name, 'Nombre', {max: 80}), email(d.email), text(d.topic, 'Tema', {max: 60, optional: true}), text(d.message, 'Mensaje', {max: 1000})).run();
  return json({ok: true}, 201);
});
route('POST', '/subscribe', async ({db, request}) => {
  const d = await body(request);
  await db.prepare('INSERT OR IGNORE INTO subscribers(email) VALUES(?)').bind(email(d.email)).run();
  return json({ok: true}, 201);
});

// ---------- Tienda aliada (vendor) ----------
function productInput(d) {
  const price = Math.round(Number(d.price) * 100);
  if (!Number.isFinite(price) || price < 1 || price > 1000000) throw new HttpError(400, 'Precio no válido.');
  const images = Array.isArray(d.images) ? d.images.slice(0, 6).map(String) : [];
  if (images.some(u => !/^(assets\/[\w./-]+|https:\/\/[^\s"'<>]+)$/.test(u) || u.length > 300)) throw new HttpError(400, 'Imagen no válida.');
  return {
    name: text(d.name, 'Nombre', {max: 100}), brand: text(d.brand, 'Marca', {max: 50}),
    pet: oneOf(d.pet, PETS, 'Mascota'), category: oneOf(d.category, CATEGORIES, 'Categoría'),
    price, unit: text(d.unit, 'Presentación', {max: 60}), stock: int(d.stock, 'Existencias'),
    short: text(d.short, 'Resumen', {max: 140, optional: true}), description: text(d.description, 'Descripción', {max: 800, optional: true}),
    images: JSON.stringify(images.length ? images : ['assets/food-green.svg'])
  };
}
route('GET', '/vendor/products', async ({db, user}) => {
  requireRole(user, 'vendor');
  const rows = (await db.prepare(`SELECT p.*, v.name AS vendor_name FROM products p JOIN vendors v ON v.id=p.vendor_id
    WHERE p.vendor_id=? ORDER BY p.created_at DESC, p.id`).bind(user.vendor_id).all()).results;
  return json({products: rows.map(r => ({...publicProduct(r), status: r.status}))});
});
route('POST', '/vendor/products', async ({db, request, user}) => {
  requireRole(user, 'vendor');
  const p = productInput(await body(request));
  const id = 'p-' + randomHex(5);
  await db.prepare(`INSERT INTO products(id,vendor_id,name,brand,pet,category,price_cents,unit,stock,short,description,images,status)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'pending')`).bind(id, user.vendor_id, p.name, p.brand, p.pet, p.category, p.price, p.unit, p.stock, p.short, p.description, p.images).run();
  return json({id}, 201);
});
route('PATCH', '/vendor/products/:id', async ({db, request, user, params}) => {
  requireRole(user, 'vendor');
  const d = await body(request);
  // Cambiar precio o stock es inmediato; cambiar el contenido de un producto aprobado lo devuelve a revisión.
  if (Object.keys(d).every(k => k === 'stock')) {
    const res = await db.prepare('UPDATE products SET stock=? WHERE id=? AND vendor_id=?').bind(int(d.stock, 'Existencias'), params.id, user.vendor_id).run();
    if (!res.meta.changes) throw new HttpError(404, 'Producto no encontrado.');
    return json({ok: true});
  }
  const p = productInput(d);
  const res = await db.prepare(`UPDATE products SET name=?,brand=?,pet=?,category=?,price_cents=?,unit=?,stock=?,short=?,description=?,images=?,status='pending'
    WHERE id=? AND vendor_id=?`).bind(p.name, p.brand, p.pet, p.category, p.price, p.unit, p.stock, p.short, p.description, p.images, params.id, user.vendor_id).run();
  if (!res.meta.changes) throw new HttpError(404, 'Producto no encontrado.');
  return json({ok: true});
});

// ---------- Administración ----------
route('GET', '/admin/summary', async ({db, user}) => {
  requireRole(user, 'admin');
  const [orders, pending, affiliates, services, messages, products, vendors] = await db.batch([
    db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(total_cents),0) t FROM orders WHERE status!='Cancelado'`),
    db.prepare(`SELECT p.id,p.name,p.pet,p.category,p.price_cents,p.stock,v.name AS vendor_name FROM products p JOIN vendors v ON v.id=p.vendor_id WHERE p.status='pending'`),
    db.prepare('SELECT * FROM affiliate_requests ORDER BY id DESC LIMIT 100'),
    db.prepare('SELECT * FROM service_requests ORDER BY id DESC LIMIT 100'),
    db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 100'),
    db.prepare(`SELECT COUNT(*) n FROM products WHERE status='approved'`),
    db.prepare(`SELECT id,name,city,status FROM vendors ORDER BY name`)
  ]);
  return json({
    stats: {orders: orders.results[0].n, sales: money(orders.results[0].t), products: products.results[0].n},
    pending: pending.results.map(r => ({id: r.id, name: r.name, pet: r.pet, category: r.category, price: money(r.price_cents), stock: r.stock, vendor: r.vendor_name})),
    affiliates: affiliates.results, services: services.results, messages: messages.results, vendors: vendors.results
  });
});
route('PATCH', '/admin/products/:id', async ({db, request, user, params}) => {
  requireRole(user, 'admin');
  const status = oneOf((await body(request)).status, ['approved', 'rejected', 'pending'], 'Estado');
  const res = await db.prepare('UPDATE products SET status=? WHERE id=?').bind(status, params.id).run();
  if (!res.meta.changes) throw new HttpError(404, 'Producto no encontrado.');
  return json({ok: true});
});
route('PATCH', '/admin/requests/:kind/:id', async ({db, request, user, params}) => {
  requireRole(user, 'admin');
  const table = {affiliates: 'affiliate_requests', services: 'service_requests'}[params.kind];
  if (!table) throw new HttpError(404, 'No encontrado.');
  const status = oneOf((await body(request)).status, ['Nueva', 'En contacto', 'Atendida', 'Descartada'], 'Estado');
  await db.prepare(`UPDATE ${table} SET status=? WHERE id=?`).bind(status, params.id).run();
  return json({ok: true});
});
// Aprobar una afiliación crea la tienda y su cuenta con una clave temporal que se muestra una sola vez.
route('POST', '/admin/affiliates/:id/approve', async ({db, user, params}) => {
  requireRole(user, 'admin');
  const a = await db.prepare('SELECT * FROM affiliate_requests WHERE id=?').bind(params.id).first();
  if (!a) throw new HttpError(404, 'Solicitud no encontrada.');
  if (a.status === 'Aprobada') throw new HttpError(409, 'Esta solicitud ya fue aprobada.');
  if (await db.prepare('SELECT 1 FROM users WHERE email=?').bind(a.email.toLowerCase()).first()) throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
  const vendorId = 'v-' + randomHex(4), temp = randomHex(5), {hash, salt} = await hashPassword(temp);
  await db.batch([
    db.prepare(`INSERT INTO vendors(id,name,city,about,status) VALUES(?,?,?,?, 'active')`).bind(vendorId, a.business, a.city, ''),
    db.prepare(`INSERT INTO users(email,name,pass_hash,pass_salt,role,vendor_id,must_change) VALUES(?,?,?,?, 'vendor', ?, 1)`).bind(a.email.toLowerCase(), a.name, hash, salt, vendorId),
    db.prepare(`UPDATE affiliate_requests SET status='Aprobada' WHERE id=?`).bind(a.id)
  ]);
  return json({vendorId, email: a.email.toLowerCase(), tempPassword: temp}, 201);
});

export async function onRequest({request, env}) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '') || '/';
  try {
    const db = env.DB;
    if (!db) throw new HttpError(503, 'Base de datos no configurada.');
    const user = await currentUser(db, request);
    for (const r of routes) {
      const m = r.method === request.method && path.match(r.re);
      if (m) return await r.handler({db, env, request, user, params: m.groups || {}});
    }
    throw new HttpError(404, 'Ruta no encontrada.');
  } catch (e) {
    if (e instanceof HttpError) return json({error: e.message}, e.status);
    console.error(e);
    return json({error: 'Error interno. Inténtalo de nuevo.'}, 500);
  }
}
