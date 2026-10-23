# Animal World · Demo

Marca provisional para presentar una tienda de productos y servicios de mascotas en Aragua, Venezuela. Proyecto estático, sin dependencias de instalación, preparado para GitHub y Cloudflare Pages.

## Demo publicada

- Web de presentación: https://fxangeel.github.io/huellitas-aragua-demo/
- Repositorio: https://github.com/fxangeel/huellitas-aragua-demo
- Código fuente en `main`. GitHub Pages publica el contenido de `dist/` desde la rama `gh-pages`.
- La demo es pública y no procesa compras reales. La propuesta comercial y el brief del cliente permanecen en la carpeta local y están excluidos por `.gitignore`.

Después de editar y revisar los cambios, actualizar desde la carpeta del proyecto:

```powershell
git add .
git commit -m "Actualizar demo"
git push origin main
git subtree push --prefix dist origin gh-pages
```

Esperar a que termine la publicación de Pages antes de compartir los cambios. No editar la rama generada `gh-pages` directamente.

## Vista local

Desde esta carpeta ejecuta `npm run dev` y abre http://127.0.0.1:4173. También se puede abrir `dist/index.html` directamente, aunque se recomienda el servidor local para mantener un origen consistente de almacenamiento.

## Qué incluye

- Inicio adaptable a móvil, categorías por mascota, catálogo con búsqueda, filtros y ordenación.
- 12 productos ilustrativos, fichas de detalle, favoritos y carrito con cantidades y control de stock.
- Checkout simulado con entrega o retiro, Pago Móvil, Binance, débito o crédito. No pide datos bancarios.
- Perfil local, pedidos de ejemplo, resumen de pedido y seguimiento de estado simulado.
- Servicios con solicitud de información y fecha preferida.
- Formulario de afiliación, panel de catálogo y stock, alta de productos y aprobación/rechazo central.
- Contacto, ayuda, historia, condiciones provisionales de envío y devolución, asistente de respuestas preparadas.

Todo se guarda solo en localStorage del navegador. No hay servidor de cuentas, autenticación, pagos, facturación fiscal, correo, WhatsApp, API de envío ni separación real de permisos. Los formularios no envían información a terceros. No introducir datos personales reales en la demo.

## Recorrido para presentar

1. Explorar el inicio y elegir una mascota.
2. Buscar un producto, abrir su ficha y guardarlo como favorito.
3. Añadir productos al carrito y modificar cantidades.
4. Completar un pedido de ejemplo y verlo en Mi cuenta.
5. Abrir Administración desde el pie y cambiar el estado del pedido; comprobarlo en Mi cuenta.
6. Abrir Panel de afiliado, añadir un producto, aprobarlo en Administración y verlo en el catálogo.
7. Probar una solicitud de servicio y una afiliación; verlas en Administración.

Para empezar de cero: Mi cuenta → Borrar mis datos de demo.

## Publicar en Cloudflare Pages

- Subir esta carpeta a un repositorio nuevo de GitHub.
- En Cloudflare: Workers & Pages → crear una aplicación de Pages → importar el repositorio.
- Framework: ninguno. Comando de compilación: vacío. Directorio de salida: `dist`.
- No configurar secretos ni variables para esta demo.
- Las rutas usan hash para funcionar sin reglas especiales ni servidor de aplicación.
- Si se publica por carga directa, cargar únicamente el contenido de `dist`.
- La URL `pages.dev` de prueba no necesita un dominio propio.

Consulta `docs/ASSETS.md` para los recursos visuales y `docs/REVISION.md` para las comprobaciones realizadas. La documentación comercial del cliente se conserva localmente.

## Edición

- `dist/index.html`: estructura global.
- `dist/styles.css`: diseño y adaptación a pantallas.
- `dist/mobile.css`: ajustes para uso táctil, navegación inferior y compra en pantallas pequeñas.
- `dist/app.js`: catálogo, vistas y simulaciones.
- `dist/assets`: fotografías e ilustraciones locales.
- `scripts/generate-assets.mjs`: fuente de las ilustraciones SVG originales. Ejecutar `npm run assets` solo si se desea regenerarlas.
- `server.mjs`: vista local sin dependencias.

No convertir esta simulación en una tienda real sin incorporar servidor, autenticación, permisos, persistencia, auditoría e integraciones verificadas.
