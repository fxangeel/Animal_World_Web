# Animal World

Catálogo multivendedor de productos y servicios para mascotas en Aragua, Venezuela. Los clientes arman su carrito y envían el pedido por WhatsApp con el mensaje ya armado; las tiendas aliadas gestionan su catálogo y la administración revisa publicaciones, pedidos y solicitudes.

- Sitio estático en `dist/` (HTML, CSS y JavaScript sin paso de compilación).
- API y cuentas en `functions/` (Cloudflare Pages Functions) con base de datos Cloudflare D1.
- Repositorio: https://github.com/fxangeel/huellitas-aragua-demo (el nombre del repositorio puede seguir así).

## Qué hace

- Catálogo con búsqueda en vivo, filtros por mascota, categoría, precio y tienda, y orden por precio o nombre.
- Fichas con galería de imágenes, descripción corta, tienda vendedora y productos relacionados.
- Carrito y pedido: se registra en el servidor (código `AW-XXXXXX`, con precios y existencias verificados allí) y se abre WhatsApp con productos, cantidades y total.
- Cuentas con tres roles: **cliente** (ve sus pedidos), **tienda aliada** (catálogo, existencias y pedidos con sus productos) y **administración** (aprueba productos, gestiona pedidos, afiliaciones, servicios y mensajes).
- Experiencia: sugerencias de búsqueda que toleran errores de ortografía, filtros activos como etiquetas, vista rápida, carrito lateral con "Deshacer", pedido agrupado por tienda, datos recordados para la próxima compra, perfil de cada tienda (`#tienda?id=`), opiniones de ejemplo, vistos recientemente, "Avísame cuando vuelva" en agotados y barra de compra fija en móvil. Código en `dist/js/extras.js` y `dist/js/checkout.js`.
- Cómo funciona, testimonios (de ejemplo, marcados), preguntas frecuentes, servicios y Afíliate.
- SEO por sección (título, descripción, `robots`), imágenes ligeras, etiquetas de accesibilidad y diseño pensado primero para 360–430 px.

Si el servidor no responde (por ejemplo, alojado solo como estático), el catálogo se lee de `data/catalog.json` y el pedido por WhatsApp sigue funcionando sin código de pedido; cuentas y formularios quedan desactivados con un aviso.

## Trabajar en local

```powershell
npm install
npm run db:local        # crea las tablas y carga el catálogo en la base local
$env:ADMIN_EMAIL='tu@correo.com'; $env:ADMIN_PASSWORD='una-clave-larga'; npm run admin
npm run dev             # http://127.0.0.1:4173
```

También se puede abrir con `INICIAR TIENDA.cmd`. `npm run static` sirve solo `dist/` (sin API). Después de cada cambio: `npm run check`.

## Datos de la tienda (pendientes de completar)

Se editan en `dist/js/config.js`:

| Campo | Estado |
|---|---|
| `whatsapp` | **Vacío.** Mientras no haya número, el botón abre WhatsApp para elegir el contacto manualmente. Formato: `584120000000`. |
| `rate` | **Valor de ejemplo (100 Bs por $).** Solo muestra bolívares referenciales en pantalla; poner la tasa del día o `0` para ocultarlos. |
| `email`, `instagram` | Vacíos; no se muestran hasta completarlos. |
| `shipping`, `cities`, `payments` | Valores ya acordados (entrega local 3 $; Maracay, Turmero, Cagua y La Victoria; Pago Móvil, Binance y tarjeta a coordinar). La tarifa también está en `wrangler.toml` (`SHIPPING_CENTS`): cambiar ambos. |

El catálogo actual (12 productos, 4 tiendas) es **provisional e inventado**: no usa nombres, marcas ni logos de negocios reales. La fuente es `scripts/make-catalog.mjs`; `npm run data` regenera `data/catalog.json`, `dist/data/catalog.json`, `db/seed.sql` y las imágenes de galería. Los precios y existencias son los ya acordados; no cambiarlos sin consultar. Los testimonios de ejemplo están en `dist/js/content.js`.

## Publicar

**Sitio completo (recomendado): Cloudflare Pages + D1.** GitHub Pages solo sirve archivos estáticos y no puede ejecutar la API.

1. `npm run db:create` y copiar el `database_id` que devuelve a `wrangler.toml`.
2. `npm run db:remote` (tablas y catálogo) y `npm run admin -- --remote` con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. En Cloudflare: Workers & Pages → crear proyecto de Pages desde el repositorio. Framework: ninguno; comando de compilación: vacío; salida: `dist`. En Settings → Bindings, enlazar la base D1 con el nombre `DB` y definir la variable `SHIPPING_CENTS`.

**Vista estática (rama `gh-pages`).** Publica solo `dist/` y funciona en modo sin servidor (catálogo y pedido por WhatsApp):

```powershell
git subtree push --prefix dist origin gh-pages
```

No editar `gh-pages` directamente.

## Estructura

- `dist/index.html`, `dist/styles.css` (base y componentes), `dist/mobile.css` (pantallas pequeñas y táctiles), `dist/theme.css` y `dist/theme-mobile.css` (tema azul: cabecera, hero a pantalla completa, secciones), `dist/js/` (módulos: `app`, `motion` (animaciones de scroll, menú y búsqueda), `shop`, `content`, `checkout`, `account`, `api`, `store`, `ui`, `config`), `dist/assets/`.
- `functions/api/[[path]].js` y `functions/_lib/core.js`: API, sesiones (cookie HttpOnly, PBKDF2) y permisos por rol.
- `db/schema.sql`, `db/seed.sql`: base de datos. `scripts/`: catálogo, galería, administrador y revisión.

## Seguridad y límites conocidos

- Las contraseñas se guardan con PBKDF2-SHA256; las sesiones expiran a los 7 días; el acceso tiene límite de intentos. Los precios y existencias siempre se calculan en el servidor.
- Aprobar una afiliación crea la cuenta de la tienda con una contraseña temporal que se muestra una sola vez y debe cambiarse al entrar.
- No hay recuperación de contraseña por correo, avisos por correo ni carga de fotos propia (los productos usan ilustraciones o una dirección `https` de imagen). Son los siguientes pasos naturales (R2 para imágenes, servicio de correo).
- Las rutas usan `#`, así que los buscadores ven una sola página; el título y la descripción cambian por sección para quien comparte o navega. Para posicionamiento por producto haría falta prerenderizar.
- Pendiente: revisar en teléfonos físicos Android e iPhone; dominio propio; `sitemap.xml` cuando exista el dominio.

Recursos visuales: `docs/ASSETS.md`. Registro de revisiones: `docs/REVISION.md`.
