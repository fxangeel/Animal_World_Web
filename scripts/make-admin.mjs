// Crea (o reemplaza) la cuenta de administración y la ejecuta en la base indicada.
// Uso:  ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD='clave-larga' node scripts/make-admin.mjs [--remote]
// La clave no se guarda en ningún archivo: solo se aplica el hash a la base de datos.
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {hashPassword} from '../functions/_lib/core.js';

const mail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const pass = process.env.ADMIN_PASSWORD || '';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) || pass.length < 10) {
  console.error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 10 caracteres).');
  process.exit(1);
}
const {hash, salt} = await hashPassword(pass);
const sql = `INSERT INTO users(email,name,pass_hash,pass_salt,role) VALUES('${mail.replace(/'/g, "''")}','Administración','${hash}','${salt}','admin')
  ON CONFLICT(email) DO UPDATE SET pass_hash=excluded.pass_hash, pass_salt=excluded.pass_salt, role='admin';`;
const target = process.argv.includes('--remote') ? '--remote' : '--local';
const dir = mkdtempSync(join(tmpdir(), 'aw-admin-'));
const file = join(dir, 'admin.sql');
writeFileSync(file, sql);
const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'animal-world', target, '--file', file], {stdio: 'inherit', shell: true});
rmSync(dir, {recursive: true, force: true});
process.exit(r.status ?? 1);
