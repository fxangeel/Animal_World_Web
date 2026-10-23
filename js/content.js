// Secciones de contenido: cómo funciona, testimonios, preguntas frecuentes, servicios, afiliación e información.
import {CONFIG, waLink} from './config.js';
import {state} from './store.js';
import {server} from './api.js';
import {icon, esc, money, page} from './ui.js';

export const services = [
  {id: 's1', name: 'Baño y peluquería', subtitle: 'Un cambio de look, muchos mimos.', text: 'Baño, secado, cepillado y corte según el tipo de pelaje. Atención con cita previa.', price: 15, icon: 'scissors'},
  {id: 's2', name: 'Consulta veterinaria', subtitle: 'Su bienestar, en buenas manos.', text: 'Solicita una cita de orientación con un profesional de la red. Disponibilidad por confirmar.', price: 20, icon: 'medical'},
  {id: 's3', name: 'Paseos con compañía', subtitle: 'Más aventuras, colitas más felices.', text: 'Paseos programados con atención individual y coordinación de recogida.', price: 8, icon: 'walk'},
  {id: 's4', name: 'Cuidado y hospedaje', subtitle: 'Como en casa, incluso lejos de casa.', text: 'Consulta opciones de cuidado por horas o estadías para tu mascota.', price: 18, icon: 'home'},
  {id: 's5', name: 'Entrega de alimento recurrente', subtitle: 'Que nunca falte su favorito.', text: 'Programa un recordatorio para reponer su alimento. Frecuencia y entrega a convenir.', price: 0, icon: 'repeat'},
  {id: 's6', name: 'Orientación de cuidado', subtitle: 'Pequeñas dudas, buenos hábitos.', text: 'Solicita orientación sobre accesorios y rutinas con el equipo de atención.', price: 0, icon: 'chat'}
];

const steps = [
  ['01', 'Elige tus productos', 'Explora el catálogo, filtra por mascota, categoría, precio o tienda y llena tu carrito.'],
  ['02', 'Envía tu pedido por WhatsApp', 'Completa tus datos y te armamos el mensaje con productos, cantidades y total. Solo tienes que enviarlo.'],
  ['03', 'Confirmamos y coordinamos', 'La tienda confirma disponibilidad, acordamos el pago y la entrega o el retiro.'],
  ['04', 'Recibe y disfruta', 'Tu mascota estrena sus favoritos. Si algo no está bien, estamos para ayudarte.']
];
export const howItWorks = () => `<section class="wrap section" aria-labelledby="h-how"><div class="section-head"><div><div class="eyebrow">Así de fácil</div><h2 id="h-how">Cómo funciona</h2><p>Comprar en Animal World toma pocos minutos.</p></div></div>
  <ol class="step-grid four">${steps.map(([n, t, p]) => `<li class="step"><b>${n}</b><h3>${t}</h3><p>${p}</p></li>`).join('')}</ol></section>`;

export function storesStrip() {
  const vendors = state.catalog.vendors;
  if (vendors.length < 2) return '';
  return `<section class="wrap section" aria-labelledby="h-stores"><div class="section-head"><div><h2 id="h-stores">Tiendas aliadas</h2><p>Comercios locales reunidos bajo una misma marca.</p></div></div>
    <div class="stores">${vendors.map(v => `<a class="store-card" href="#catalogo?vendor=${esc(v.id)}">${icon('store')}<b>${esc(v.name)}</b><span>${esc(v.city || 'Aragua')}</span><small>${esc(v.about || '')}</small></a>`).join('')}</div></section>`;
}

const quotes = [
  ['Pedí el alimento de mi perro por WhatsApp y todo fue clarísimo: me confirmaron el total y la entrega.', 'Cliente de ejemplo · Maracay'],
  ['Me gustó poder comparar productos de varias tiendas sin salir de casa.', 'Cliente de ejemplo · Turmero'],
  ['Mi negocio ahora llega a más gente. Mantener mi catálogo al día es muy sencillo.', 'Tienda aliada de ejemplo · Cagua']
];
export const testimonials = () => `<section class="wrap section" aria-labelledby="h-quotes"><div class="section-head"><div><div class="eyebrow">Opiniones</div><h2 id="h-quotes">Lo que dicen de Animal World</h2></div><span class="sample-badge">Testimonios de ejemplo</span></div>
  <div class="quotes">${quotes.map(([q, a]) => `<figure class="quote"><span class="sample-badge small">Ejemplo</span><blockquote>«${esc(q)}»</blockquote><figcaption>${esc(a)}</figcaption></figure>`).join('')}</div>
  <p class="subtle">Estos testimonios son de ejemplo y se reemplazarán por opiniones reales de clientes.</p></section>`;

export const faqItems = [
  ['¿Cómo hago un pedido?', 'Añade productos al carrito, completa tus datos y envía el pedido: se abre WhatsApp con el mensaje ya armado (productos, cantidades y total). La tienda lo confirma contigo.'],
  ['¿Dónde entregan?', `Entregamos en ${CONFIG.cities.join(', ')}. La disponibilidad y el costo final se confirman al coordinar el pedido. La entrega local tiene una tarifa de ${money(CONFIG.shipping)}.`],
  ['¿Cómo puedo pagar?', 'Aceptamos Pago Móvil y Binance, y podemos coordinar pago con tarjeta. El pago se acuerda por WhatsApp al confirmar tu pedido; no se te cobra desde la web.'],
  ['¿Puedo retirar mi pedido?', 'Sí. Elige «Retiro coordinado» al hacer tu pedido y te indicaremos el punto y el horario al confirmar.'],
  ['¿Qué pasa si el producto llega dañado?', 'Escríbenos con tu número de pedido y fotos del producto y su empaque. Revisamos cada caso para coordinar un cambio o una devolución.'],
  ['¿Puedo reservar un servicio?', 'Sí. Deja tu solicitud en la sección de servicios y la tienda confirma disponibilidad y fecha contigo.'],
  ['¿Cómo vendo mis productos en Animal World?', 'Solicita tu afiliación. Revisamos tu solicitud, creamos tu cuenta de tienda y publicas tus productos desde tu panel; cada publicación nueva pasa por una revisión.']
];
export const faqPreview = () => `<section class="wrap section" aria-labelledby="h-faq"><div class="section-head"><div><div class="eyebrow">Resolvemos tus dudas</div><h2 id="h-faq">Preguntas frecuentes</h2></div><a href="#ayuda" class="text-link">Ver todas <span>↗</span></a></div>
  <div class="faq">${faqItems.slice(0, 4).map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>`;

export function servicePage() {
  return page('Porque cuidarlos también es quererlos', 'Servicios para acompañarte en cada etapa de su vida, aquí en Aragua.',
    `<div class="service-grid">${services.map(s => `<article class="service-card"><div class="service-icon">${icon(s.icon)}</div><h2>${s.name}</h2><p>${s.text}</p>
      <div class="service-price">${s.price ? `Desde ${money(s.price)}` : 'Consultar disponibilidad'}</div>
      <button class="button secondary" data-action="book" data-id="${s.id}">Solicitar información ${icon('arrow')}</button></article>`).join('')}</div>
      <p class="subtle">Tu solicitud se envía al equipo, que confirma disponibilidad y fecha contigo antes de agendar.</p>`, 'Servicios');
}

export function howPage() {
  return page('Cómo funciona', 'Del catálogo a tu puerta en cuatro pasos.', `<ol class="step-grid four">${steps.map(([n, t, p]) => `<li class="step"><b>${n}</b><h3>${t}</h3><p>${p}</p></li>`).join('')}</ol>
    <div class="button-row"><a class="button" href="#catalogo">Ver productos ${icon('arrow')}</a><a class="button secondary" href="#ayuda">Preguntas frecuentes</a></div>`, 'Cómo funciona');
}

export function affiliatePage() {
  const cities = [...CONFIG.cities, 'Otra zona de Aragua'];
  return page('Hagamos crecer esta comunidad', 'Tus productos y servicios pueden llegar a más hogares de Aragua. Nosotros ponemos la plataforma; tú, el catálogo.',
    `<ol class="step-grid"><li class="step"><b>01</b><h3>Solicita tu afiliación</h3><p>Cuéntanos sobre tu comercio y lo que ofreces.</p></li>
      <li class="step"><b>02</b><h3>Gestiona tu catálogo</h3><p>Con tu cuenta de tienda publicas productos y actualizas existencias desde tu panel.</p></li>
      <li class="step"><b>03</b><h3>Recibe y prepara pedidos</h3><p>Ves los pedidos que incluyen tus productos y marcas cuando están preparados.</p></li></ol>
    <div class="info-grid"><div class="content-card"><h2>Una sola marca. Muchos aliados.</h2>
      <p>El público compra bajo Animal World. Los datos de contacto de tus clientes solo los ve tu tienda y la administración.</p>
      <p>Cada producto nuevo se revisa antes de aparecer en el catálogo.</p>
      <h3>Condiciones</h3><p>Comisiones, liquidaciones, inventario y logística se acuerdan contigo antes de empezar a operar.</p>
      <a href="#cuenta" class="button secondary">Ya tengo cuenta de tienda ${icon('arrow')}</a></div>
    <form id="affiliate-form" class="content-card"><h2>Quiero formar parte</h2>
      <div class="field"><label for="business">Nombre del comercio</label><input id="business" name="business" required maxlength="100" autocomplete="organization"></div>
      <div class="form-grid"><div class="field"><label for="affiliate-name">Persona de contacto</label><input id="affiliate-name" name="name" required maxlength="80" autocomplete="name"></div>
        <div class="field"><label for="affiliate-phone">Teléfono</label><input id="affiliate-phone" name="phone" type="tel" required maxlength="25" autocomplete="tel" placeholder="0412 000 0000"></div></div>
      <div class="field"><label for="affiliate-email">Correo</label><input id="affiliate-email" name="email" type="email" required maxlength="120" autocomplete="email"></div>
      <div class="form-grid"><div class="field"><label for="affiliate-city">Ciudad</label><select name="city" id="affiliate-city">${cities.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="affiliate-type">¿Qué ofreces?</label><select id="affiliate-type" name="type"><option>Productos</option><option>Servicios</option><option>Productos y servicios</option></select></div></div>
      ${server.online ? '' : '<p class="note">El envío de solicitudes necesita el servidor de la tienda y no está disponible en este momento.</p>'}
      <button class="button wide" type="submit" ${server.online ? '' : 'disabled'}>Enviar solicitud ${icon('arrow')}</button></form></div>`, 'Afíliate');
}

export function contactPage() {
  const lines = [];
  if (CONFIG.whatsapp) lines.push(`<h3>WhatsApp</h3><p><a href="${waLink('Hola, tengo una consulta sobre Animal World.')}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a></p>`);
  if (CONFIG.email) lines.push(`<h3>Correo</h3><p><a href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a></p>`);
  if (CONFIG.instagram) lines.push(`<h3>Instagram</h3><p>${esc(CONFIG.instagram)}</p>`);
  return page('Hablemos de tu mejor amigo', 'Una atención cercana, de esas que se sienten como en casa.',
    `<div class="info-grid"><div class="content-card"><h2>Estamos en Aragua</h2><p>Maracay, Venezuela · Atendemos ${CONFIG.cities.join(', ')}.</p>
      ${lines.join('') || '<p>Escríbenos con el formulario y te respondemos a la brevedad.</p>'}
      <a class="button secondary" href="${waLink('Hola, tengo una consulta sobre Animal World.')}" target="_blank" rel="noopener">Escribir por WhatsApp ${icon('chat')}</a></div>
    <form id="contact-form" class="content-card"><h2>Déjanos un mensaje</h2>
      <div class="field"><label for="contact-name">Nombre</label><input name="name" id="contact-name" required maxlength="80" autocomplete="name"></div>
      <div class="field"><label for="contact-email">Correo</label><input name="email" id="contact-email" type="email" required maxlength="120" autocomplete="email"></div>
      <div class="field"><label for="contact-topic">Tema</label><select id="contact-topic" name="topic"><option>Consulta de productos</option><option>Estado de mi pedido</option><option>Cambios y devoluciones</option><option>Quiero afiliarme</option><option>Otro</option></select></div>
      <div class="field"><label for="contact-message">Tu mensaje</label><textarea id="contact-message" name="message" required maxlength="1000"></textarea></div>
      ${server.online ? '' : '<p class="note">El formulario necesita el servidor de la tienda. Mientras tanto, escríbenos por WhatsApp.</p>'}
      <button class="button" type="submit" ${server.online ? '' : 'disabled'}>Enviar mensaje ${icon('arrow')}</button></form></div>`, 'Contacto');
}

export function infoPage(path) {
  if (path === 'ayuda') return page('Siempre cerca de ti', 'Respuestas para que comprar sea tan fácil como consentirlos.', `<div class="faq">${faqItems.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
    <div class="button-row" style="margin-top:28px"><a class="button" href="#contacto">¿Otra duda? Escríbenos ${icon('arrow')}</a></div>`, 'Preguntas frecuentes');
  if (path === 'nosotros') return page('Nacimos para conectar buenas huellas', 'Una plataforma local para todas las mascotas de Aragua.', `<div class="content-narrow">
    <p>Creemos que cuidar a una mascota debería ser sencillo, cercano y lleno de cariño. Por eso existe Animal World: un lugar que reúne productos y servicios de comercios locales en una experiencia fácil de usar.</p>
    <p>Desde el alimento de todos los días hasta ese juguete que se vuelve inseparable, te acompañamos con opciones para perros, gatos, aves, peces y pequeños compañeros.</p>
    <h2>Una comunidad bajo una misma marca</h2><p>Los comercios afiliados aportan su catálogo y su experiencia. Animal World coordina la presentación, la atención y el pedido para que encuentres lo que necesitas en un solo lugar.</p>
    <a href="#afiliate" class="button">Sé parte de la comunidad ${icon('arrow')}</a></div>`, 'Nuestra historia');
  if (path === 'envios') return page('De nuestra comunidad a tu puerta', 'Entregas y retiros en el centro de Aragua.', `<div class="info-grid"><div class="content-card"><h2>Entrega local</h2>
    <p>Zonas: ${CONFIG.cities.join(', ')}. La entrega tiene una tarifa de ${money(CONFIG.shipping)}.</p><p>Confirmamos disponibilidad, costo final y la hora de entrega contigo por WhatsApp antes de despachar.</p></div>
    <div class="content-card"><h2>Retiro coordinado</h2><p>Elige retiro al hacer tu pedido, sin costo. Te indicamos el punto y el horario al confirmar la disponibilidad.</p></div></div>`, 'Envíos y retiros');
  if (path === 'devoluciones') return page('Queremos que todo llegue bien', 'Cambios y devoluciones.', `<div class="content-narrow">
    <h2>Si algo no está bien</h2><p>Recibimos reportes cuando un producto llega dañado, defectuoso, vencido o distinto al pedido. Escríbenos con tu número de pedido, una descripción y fotografías del producto y su empaque.</p>
    <h2>Revisión y solución</h2><p>Revisamos cada caso y coordinamos un reemplazo o una devolución según corresponda. Si el inconveniente es atribuible al producto o a la entrega, cubrimos la logística de la solución.</p>
    <h2>Cuida el producto mientras lo revisamos</h2><p>Conserva el empaque y evita usar productos que presenten daños o alteraciones. En alimentos, incluye el lote y la fecha de vencimiento.</p>
    <a href="#contacto" class="button">Contactar al equipo ${icon('arrow')}</a></div>`, 'Cambios y devoluciones');
  return page('Esta página se fue de paseo', 'Vuelve al inicio para encontrar lo que buscas.', '<a class="button" href="#inicio">Volver al inicio</a>', 'No encontrada');
}
