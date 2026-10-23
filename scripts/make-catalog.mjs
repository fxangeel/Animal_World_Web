// Fuente única del catálogo provisional. Genera data/catalog.json, dist/data/catalog.json y db/seed.sql.
// Precios y existencias son los ya acordados; marcas y tiendas son inventadas (no hay negocios reales).
import {mkdirSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const vendors = [
  {id: 'v-animal-world', name: 'Animal World', city: 'Maracay', about: 'Selección propia de la casa.'},
  {id: 'v-rincon', name: 'Rincón Mascotero', city: 'Maracay', about: 'Alimentos y accesorios para perros.'},
  {id: 'v-casa-felina', name: 'Casa Felina', city: 'Cagua', about: 'Todo para gatos y su hogar.'},
  {id: 'v-aqua', name: 'Aqua Jardín', city: 'Turmero', about: 'Peces, terrarios y pequeños animales.'}
];
// [id, tienda, nombre, marca, mascota, categoría, precio, precio anterior, presentación, imagen, etiqueta, stock, resumen, descripción]
const rows = [
  ['p1','v-rincon','Alimento completo para perro adulto','Campo Verde','Perros','Alimentos',24.90,29.90,'Bolsa · 4 kg','food-green.svg','Favorito de la casa',18,'Alimento seco para el día a día de tu perro adulto.','Alimento seco pensado para perros adultos de razas medianas y grandes. Consulta la etiqueta de la bolsa para la ración diaria según el peso de tu mascota.'],
  ['p2','v-casa-felina','Alimento para gato adulto · Pollo','Nido Felino','Gatos','Alimentos',16.50,null,'Bolsa · 1,5 kg','food-coral.svg','Para consentirlo',12,'Croqueta de pollo para gatos adultos.','Alimento seco con sabor a pollo para gatos adultos. Mantén siempre agua fresca a su alcance y consulta la etiqueta para la ración recomendada.'],
  ['p3','v-animal-world','Pelota de cuerda natural','Animal World · Selección','Perros','Juguetes',6.50,null,'Algodón · Tamaño mediano','rope.svg','Tiempo de jugar',25,'Cuerda de algodón para jugar y morder.','Pelota de cuerda de algodón natural, ideal para juegos de buscar y jalar. Úsala siempre con supervisión y reemplázala si se deshilacha.'],
  ['p4','v-rincon','Champú suave para mascotas','Animal World · Cuidado','Perros','Higiene',9.90,12,'Avena · 250 ml','shampoo.svg','−18%',15,'Champú con avena para el baño de rutina.','Champú de fórmula suave con avena para la rutina de baño. Evita el contacto con ojos y oídos y enjuaga bien.'],
  ['p5','v-casa-felina','Arena aglomerante para gatos','Nido Felino','Gatos','Higiene',12.50,null,'Sin perfume · 5 kg','litter.svg',null,10,'Arena que forma grumos y controla el olor.','Arena aglomerante sin perfume para el arenero diario. Retira los grumos a diario y renueva la arena por completo cada semana.'],
  ['p6','v-animal-world','Mezcla de semillas para aves','Animal World · Natural','Aves','Alimentos',5.80,null,'Bolsa · 500 g','food-yellow.svg',null,20,'Mezcla de semillas variadas para aves pequeñas.','Mezcla de semillas para aves pequeñas de jaula. Complementa con frutas y verduras frescas y agua limpia todos los días.'],
  ['p7','v-aqua','Alimento en hojuelas para peces','Animal World · Aqua','Peces','Alimentos',7.20,null,'Frasco · 100 g','fish-food.svg',null,14,'Hojuelas para peces ornamentales de agua dulce.','Alimento en hojuelas para peces ornamentales. Ofrece solo lo que consuman en pocos minutos para cuidar la calidad del agua.'],
  ['p8','v-rincon','Heno natural para pequeños amigos','Animal World · Natural','Pequeños','Alimentos',8.50,null,'Bolsa · 500 g','hay.svg',null,9,'Heno seco para conejos y cobayos.','Heno natural para conejos, cobayos y otros pequeños herbívoros. Debe estar siempre disponible como base de su alimentación.'],
  ['p9','v-animal-world','Plato de cerámica para mascotas','Animal World · Hogar','Gatos','Accesorios',11,null,'Verde salvia · 400 ml','bowl.svg',null,8,'Plato de cerámica estable y fácil de limpiar.','Plato de cerámica con base pesada que no se desliza. Apto para alimento o agua; lávalo a diario.'],
  ['p10','v-rincon','Cama suave de descanso','Animal World · Hogar','Perros','Accesorios',32,null,'Arena · Tamaño mediano','bed.svg',null,6,'Cama acolchada para perros medianos.','Cama acolchada con borde alto para que tu perro descanse con comodidad. Cubierta lavable.'],
  ['p11','v-casa-felina','Cepillo para el cuidado del pelaje','Animal World · Cuidado','Gatos','Cuidado',8.90,null,'Mango de madera · 1 unidad','brush.svg',null,11,'Cepillo de cerdas suaves con mango de madera.','Cepillo para el pelaje de gatos y perros pequeños. Cepillar con regularidad ayuda a reducir las bolas de pelo.'],
  ['p12','v-aqua','Refugio natural para terrario','Animal World · Natural','Reptiles','Accesorios',14,null,'Madera · Tamaño pequeño','shelter.svg',null,5,'Refugio de madera para terrarios pequeños.','Refugio de madera para dar escondite y sombra en terrarios pequeños. Verifica que las medidas sean adecuadas para tu especie.']
];
const products = rows.map(([id, vendor, name, brand, pet, category, price, old, unit, asset, tag, stock, short, description]) => ({
  id, vendor, name, brand, pet, category, price, old, unit, tag, stock, short, description,
  images: [`assets/${asset}`, `assets/gallery/${id}-detalle.svg`, `assets/gallery/${id}-escena.svg`]
}));
const catalog = {vendors, products};
for (const d of ['data/', 'dist/data/', 'db/']) mkdirSync(new URL(d, root), {recursive: true});
writeFileSync(new URL('data/catalog.json', root), JSON.stringify(catalog, null, 1));
writeFileSync(new URL('dist/data/catalog.json', root), JSON.stringify(catalog));
const q = v => v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const cents = v => v == null ? null : Math.round(v * 100);
let sql = '-- Generado por scripts/make-catalog.mjs. Catálogo provisional.\n';
for (const v of vendors) sql += `INSERT OR REPLACE INTO vendors(id,name,city,about,status) VALUES(${q(v.id)},${q(v.name)},${q(v.city)},${q(v.about)},'active');\n`;
for (const p of products) sql += `INSERT OR REPLACE INTO products(id,vendor_id,name,brand,pet,category,price_cents,old_price_cents,unit,tag,stock,short,description,images,status) VALUES(${q(p.id)},${q(p.vendor)},${q(p.name)},${q(p.brand)},${q(p.pet)},${q(p.category)},${cents(p.price)},${q(cents(p.old))},${q(p.unit)},${q(p.tag)},${p.stock},${q(p.short)},${q(p.description)},${q(JSON.stringify(p.images))},'approved');\n`;
writeFileSync(new URL('db/seed.sql', root), sql);
console.log(`Catálogo: ${products.length} productos, ${vendors.length} tiendas.`);
