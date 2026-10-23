// npm run check: sintaxis, catálogo, archivos referenciados y textos que no deben aparecer en el sitio publicado.
import {readdirSync, readFileSync, existsSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join, relative} from 'node:path';

const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/%20/g, ' ');
const errors = [];
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.wrangler' || name === '.git') continue;
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};

// 1. Sintaxis de todo el JavaScript propio.
const js = ['dist', 'functions', 'scripts'].flatMap(d => walk(join(root, d))).filter(f => /\.m?js$/.test(f)).concat(join(root, 'server.mjs'));
for (const f of js) {
  const r = spawnSync(process.execPath, ['--check', f], {encoding: 'utf8'});
  if (r.status !== 0) errors.push(`Sintaxis en ${relative(root, f)}:\n${r.stderr}`);
}

// 2. Catálogo e imágenes.
const catalog = JSON.parse(readFileSync(join(root, 'dist/data/catalog.json'), 'utf8'));
const ids = new Set();
for (const p of catalog.products) {
  if (ids.has(p.id)) errors.push(`Producto duplicado: ${p.id}`);
  ids.add(p.id);
  if (!catalog.vendors.some(v => v.id === p.vendor)) errors.push(`${p.id}: tienda inexistente (${p.vendor})`);
  if (!(p.price > 0) || !Number.isInteger(p.stock) || p.stock < 0) errors.push(`${p.id}: precio o stock no válidos`);
  if (!p.images?.length) errors.push(`${p.id}: sin imágenes`);
  for (const img of p.images || []) if (!existsSync(join(root, 'dist', img))) errors.push(`${p.id}: falta ${img}`);
}

// 3. Recursos que referencia index.html.
const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
for (const m of html.matchAll(/(?:href|src)="((?!https?:|#|mailto:)[^"]+)"/g)) if (!existsSync(join(root, 'dist', m[1]))) errors.push(`index.html referencia ${m[1]} y no existe`);

// 4. Texto que no debe llegar al sitio publicado (carácter de demostración o marcas reales).
const banned = /\bdemo\b|demostraci[oó]n|simulad|ficticio|huellitas|\b(purina|royal canin|pedigree|whiskas|dog chow|cat chow)\b/i;
for (const f of walk(join(root, 'dist')).filter(f => /\.(html|js|css|json)$/.test(f))) {
  const t = readFileSync(f, 'utf8');
  const m = t.match(banned);
  if (m) errors.push(`${relative(root, f)} contiene «${m[0]}»`);
}

if (errors.length) {
  console.error(errors.map(e => '✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ ${js.length} archivos JS con sintaxis válida · ${catalog.products.length} productos · recursos y textos revisados.`);
