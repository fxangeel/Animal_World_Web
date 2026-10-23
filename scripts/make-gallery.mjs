// Genera 2 imágenes extra por producto (detalle y escena) a partir de la ilustración principal.
// Son marcadores hasta que cada tienda suba sus fotos reales.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('data/catalog.json', root), 'utf8'));
mkdirSync(new URL('dist/assets/gallery/', root), {recursive: true});
const inner = file => readFileSync(new URL(`dist/assets/${file}`, root), 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const bgs = {Perros: '#f4e2d5', Gatos: '#f6e8c8', Aves: '#f6e8c8', Peces: '#dfeced', Pequeños: '#eee3db', Reptiles: '#e9e6ef'};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
for (const p of catalog.products) {
  const art = inner(p.images[0].split('/').pop());
  const bg = bgs[p.pet] || '#e7eddf';
  writeFileSync(new URL(`dist/assets/gallery/${p.id}-detalle.svg`, root),
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="560" viewBox="0 0 600 560"><rect width="600" height="560" fill="#f7f8f3"/><g transform="translate(-90 -60) scale(2.3)">${art}</g></svg>`);
  writeFileSync(new URL(`dist/assets/gallery/${p.id}-escena.svg`, root),
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="560" viewBox="0 0 600 560"><rect width="600" height="560" fill="${bg}"/><circle cx="300" cy="270" r="215" fill="#ffffff" opacity=".55"/><g transform="translate(120 70) scale(1.2) rotate(-6 150 140)">${art}</g><text x="300" y="528" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#254d3d">${esc(p.unit)}</text></svg>`);
}
console.log(`Galería: ${catalog.products.length * 2} imágenes.`);
