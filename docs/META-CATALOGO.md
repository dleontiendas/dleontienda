# Catálogo y medición de D’LEON GOLD — implementación local

La integración fue publicada con autorización el 27 de septiembre de 2026; ver `PUBLICACION-META.md`.
No se ha creado un catálogo externo ni contratado publicidad.
El seguimiento está desactivado por defecto. No basta con colocar el Pixel ID: también
se necesitan las banderas de activación y una decisión explícita del visitante en el gestor de consentimiento.

## Feed

- Ruta pública verificada: `https://dleongold.com/meta/catalog.xml`.
- Función Firebase: `metaCatalog`, GET/HEAD, XML RSS con campos `g:` y UTF-8.
- Lectura de `productos/{category}/items/{id}` mediante `collectionGroup('items')` filtrado por ruta.
- Una entrada por color/talla, usando `variants[].tallas[]` (compatibilidad de lectura con `sizes`).
- ID `v:<sku_master codificado>`; para registros antiguos, `l:<sku>:<color>:<talla>`, con cada parte codificada.
- No dependen del precio, inventario o posición del arreglo. Si se cambia el SKU Maestro o la identidad
  de una variante antigua, cambia su ID: corregir esos datos antes de importar el catálogo, no regenerarlos arbitrariamente.
- Grupo `p:<sku>`. Se excluyen TODOS los registros ambiguos si se repite el SKU de producto o el ID de variante.
- Campos: id, title, description, availability, condition, price, sale_price cuando aplica,
  link, image_link, additional_image_link, brand, product_type, item_group_id, color, size, mpn (SKU/referencia).
- Sin descuento: `price = precio actual`. Con `oldPrice > precio actual`: `price = oldPrice`,
  `sale_price = precio actual`. Un `oldPrice: null` en talla anula el descuento general.
- Precio propio de talla tiene prioridad; si falta, hereda el general. La tarjeta incluye ambos
  tipos de talla para calcular el mínimo y mostrar «Desde» solo si hay más de un precio disponible.
- Stock cero: `out of stock`. Inactivos, campos obligatorios incompletos o imágenes no válidas: excluidos.
- `product_type` se deriva de categoría/departamento/subcategoría. No se inventan GTIN ni categorías de Google.
- Imágenes: HTTPS, sin credenciales, dominios permitidos `dleongold.com`, `www.dleongold.com`,
  `lh3.googleusercontent.com`, `drive.google.com`. Drive se normaliza a una imagen de 1200 px.
  Otros proveedores requieren revisar y ampliar esta lista explícitamente.
- Se verifican respuestas HTTP y tipo de contenido de las imágenes, con timeout y límite de concurrencia.
  No se aceptan redirecciones a hosts privados o fuera de la lista. Esto no certifica calidad visual,
  dimensiones reales ni aprobación por políticas de Meta.
- Caché del XML 60 segundos; imágenes válidas 5 minutos, errores 30 segundos. Meta no recibe cambios de
  inventario instantáneamente: también depende de la periodicidad de su descarga.
- Un catálogo vacío o un fallo de generación responde 503 para evitar reemplazar accidentalmente el catálogo
  por una descarga vacía. Si se desea retirar todo el catálogo, será una acción explícita aparte.
- El feed expone únicamente datos comerciales; no incluye clientes, pedidos, costes, claves ni tokens.

## Enlace de variante

`/products/{category}/{productId}?variant=<id codificado>` selecciona color y talla exactos, incluso
si la talla está agotada (el botón de agregar queda deshabilitado). Una variante desconocida muestra
un mensaje, sin sustituirla silenciosamente por otra oferta.
Las vistas previas de Firebase también resuelven variante, precio e imagen. Las rutas anteriores se conservan.

## Eventos de navegador

- `PageView`: navegación pública, con deduplicación de efectos de React y un nuevo evento al volver atrás.
  Se excluyen rutas administrativas/de cuenta y búsquedas con texto libre en la URL por privacidad.
- `ViewContent`: ficha cargada y variante identificada; precio de esa talla.
- `Search`: búsqueda ejecutada por Enter, botón o selección de resultado. Envía IDs coincidentes;
  deliberadamente NO envía el texto libre, que puede contener datos personales.
- `AddToCart`: acción de agregar, fuera del actualizador de estado de React. Importe = precio de talla × cantidad.
- `InitiateCheckout`: entrada con carrito válido. Valor de los artículos, sin un envío todavía no confirmado.
- `AddPaymentInfo`: se envía después de que Firebase valida inventario, variantes y precios y el comprador
  confirma el método de pago. Usa `payment:<orderId>` y los datos comerciales recalculados por el servidor.
- `Purchase`: respuesta autenticada del servidor con `metaPurchase`, nunca la URL de éxito por sí sola.
  Valor = total confirmado, incluido envío. Los contenidos usan los precios de los artículos del pedido.
- Moneda COP, sin multiplicar por 100 para Meta. Cantidades, IDs, color y talla provienen del catálogo/pedido.
- `Purchase` comparte `purchase:<orderId>` con CAPI; protección local adicional contra recargas repetidas.
- Inicialización asíncrona, auto-configuración de eventos desactivada y sin advanced matching de clientes.
  Un fallo de Meta no impide navegación, carrito ni pagos. El script solo se carga en `dleongold.com`, no localhost.

## Consentimiento implementado localmente

`setMetaConsent(false)` continúa siendo el estado inicial. El banner ofrece aceptar, rechazar y personalizar
marketing sin condicionar la compra; marketing no aparece preseleccionado. La elección conserva versión,
fecha y origen en el navegador, se restaura en visitas posteriores y se sincroniza entre pestañas.

La política de cookies explica las finalidades, los eventos y el tratamiento de `_fbp`/`_fbc`; la política de
privacidad describe los datos usados para atribución. El pie de página permite retirar o cambiar la elección.
Al retirar marketing se revoca Pixel, se eliminan sus cookies accesibles, se vacían eventos aún no enviados y
se llama a `revokeOrderMetaConsent` con los tokens privados de pedidos pendientes. El servidor elimina la
atribución guardada y cancela un envío CAPI que todavía no haya sido transmitido. Un evento ya enviado no puede
recuperarse. Si se vuelve a aceptar, los pedidos nuevos vuelven a conservar atribución; un pedido antiguo
revocado permanece sin seguimiento.

Tras consentir, CAPI usa correo, teléfono e ID autenticado cuando existen: los normaliza y cifra con SHA-256.
IP, agente de usuario, `_fbp` y `_fbc` se transmiten sin hash, según el contrato de Meta. Antes de publicar,
revisar los textos legales y recorrer aceptación, rechazo y retirada en el entorno publicado de prueba.

## Conversions API y confirmación

La copia de Render vive en `render-backend/` y está excluida del repositorio principal. Su servicio de
inventario marca `metaPaymentVerified` y `metaConfirmedAt` solo tras una aprobación procesada por ese backend.
Wompi valida firma/importe/moneda, Addi autorización y monto, Sistecrédito consulta al proveedor.
Los handlers antiguos de Firebase que solo cambian `status` NO habilitan compras para Meta.

El servicio central `render-backend/src/metaConversions.js` se invoca después de la confirmación verificada
de Wompi, Addi o Sistecrédito. Requiere consentimiento válido, pago aprobado, inventario `committed`,
marca de verificación y artículos con identificadores/precios válidos. Usa los mismos IDs y el mismo
`purchase:<orderId>` que el navegador. No inventa `_fbp` ni `_fbc`; puede enviar otros datos de coincidencia
válidos cuando estén disponibles. Los pedidos antiguos sin estos metadatos no se envían retrospectivamente.

`metaConversionEvents/{orderId}` guarda estado, intentos, lease y fecha; su acceso público queda denegado
por las reglas existentes. Transacción para concurrencia, reintento con event_id idéntico,
timeout HTTP de 5 segundos y errores sanitizados. El envío ocurre DESPUÉS de confirmar la transacción
de pago/inventario, y nunca modifica sus importes ni vuelve a descontar stock. Tras seis días se omite el envío tardío.
El token solo se lee en el entorno privado de Render. El entorno de pruebas usa un transporte simulado y no
envía compras a Meta.

Cambios aditivos de datos: `items[].metaCatalogId`, `orders.metaTracking` (null por defecto),
`metaPaymentVerified`, `metaConfirmedAt` y colección privada `metaConversionEvents` cuando se active.
No se migran ni eliminan productos, pedidos ni clientes. La corrección de `ordersApi.createOrder` conserva
el `accessToken` devuelto por Firebase; su hash sigue siendo la credencial almacenada en el servidor.

## Variables (no colocar secretos en Git ni en React)

| Variable | Dónde colocarla en una futura activación |
| --- | --- |
| REACT_APP_META_PIXEL_ID | `.env.production.local` de la raíz o entorno de build |
| REACT_APP_META_ENABLED | Mismo lugar; `true` al publicar la integración después de revisar y validar el consentimiento |
| META_PIXEL_ID | Entorno privado de Render |
| META_CAPI_ACCESS_TOKEN | Secreto en el entorno privado de Render; nunca React, Git o respuestas API |
| META_TEST_EVENT_CODE | Entorno privado de Render, solo durante «Probar eventos»; luego eliminar |

Ejemplos sin credenciales: `.env.meta.example` y `render-backend/.env.example`.
No se creó ningún secreto ni se cambió una configuración remota. No se necesita el token para el feed.

## Archivos de esta implementación

Nuevos:
- `src/meta/catalogContract.js`, `src/meta/pixel.js`, `src/meta/MetaPageView.js`, `src/meta/pixel.test.js`.
- `src/consent/ConsentContext.js`, `src/consent/CookieConsent.js`, `src/consent/consentStorage.js`, estilos y pruebas.
- `src/components/legales/Cookies.js` y `src/components/legales/Legal.css`.
- `functions/meta/catalogContract.cjs` (copia portable comprobada por prueba de paridad), `catalog.js`, `feed.js`,
  `conversionsDomain.js`, `catalog.test.js`, `conversions.test.js`, `integration.emulator.test.js`.
- `render-backend/src/metaConversions.js` y `render-backend/test/metaConversions.test.js`.
- `src/api/ordersApi.test.js`, `src/components/product/ProductDetail.meta.test.js`.
- `scripts/meta-audit.mjs`, `scripts/test-meta-emulators.cjs`, los dos ejemplos de entorno y este documento.

Modificados:
- `src/App.js`, `src/api/ordersApi.js`, `src/context/CartContext.js`.
- `src/components/footer/Footer.js`, `src/components/footer/Footer.css`, `src/components/legales/Privacidad.js`.
- `src/App.test.js`, `functions/test/inventory.emulator.test.js` (actualización de pruebas heredadas).
- `src/components/navbar/Navbar.js`, `src/components/product/ProductDetail.js`.
- `src/components/checkout/Checkout.js`, `src/components/checkout/CheckoutSuccess.js`.
- `src/components/utils/productPricing.js` y su prueba.
- `functions/orders/createOrder.js`, `functions/orders/readOrders.js`, `functions/products/productSharePreview.js`.
- `functions/index.js`, `functions/package.json`, `functions/local-emulator/index.js`, `firebase.json`, `.gitignore`.
- `render-backend/src/inventoryService.js` y `render-backend/test/inventoryService.test.js` (fuera del Git principal).

Funciones principales: `buildCatalog`, `catalogXml`, `validateCatalogImages`, `metaCatalogHandler`, `catalogId`,
`variantPrice`, `selectCatalogVariant`, `commerceItem`, `trackMeta`, `trackProduct`, `trackSearch`,
`trackPurchase`, `sanitizeTracking`, `purchaseData`, `buildPurchaseEvent`, `sendConversion`, `deliverPurchase`,
`readConsent`, `saveConsent`, `clearMetaCookies` y `revokeOrderMetaConsentHandler`.

## Validación reproducible

- `npm test -- --watch=false --runInBand` (frontend; resultados en `RESULTADOS-META.md`).
- `npm --prefix functions test` (incluye pruebas unitarias Meta).
- `npm --prefix render-backend test` (pasarelas e inventario).
- `firebase emulators:exec --only firestore --project demo-dleon "node scripts/test-meta-emulators.cjs"`.
  Solo proyecto demo local; nunca ejecutar las pruebas de borrado de fixtures contra datos reales.
- `npm run build`.
- `node scripts/meta-audit.mjs --live`: consulta pública de solo lectura. Genera `outputs/meta/audit.json`
  y `outputs/meta/catalog.local.xml`. No publica esos archivos. Alternativamente acepta una copia JSON de documentos.
- Pruebas con fixtures no envían eventos ni compras a proveedores externos.

## Pasos manuales futuros en Meta (NO realizados)

Los nombres exactos de opciones pueden variar por cuenta, país y disponibilidad de Meta.
Primero revisar el consentimiento implementado y obtener autorización expresa de publicación; después:

1. **Catálogo:** entrar a Commerce Manager con el negocio correcto; seleccionar un catálogo de comercio
   electrónico existente o crear uno para productos. Asignar propietario y permisos de la cuenta publicitaria.
2. **Fuente de datos:** en Catálogo → Orígenes/Fuentes de datos, elegir feed programado; poner la URL HTTPS
   publicada `/meta/catalog.xml`, moneda COP y una periodicidad adecuada al stock (la más frecuente disponible
   que resulte necesaria). Evitar importar también estos mismos productos con otra fuente e IDs distintos.
3. **Primera importación:** revisar cantidad de artículos/variantes, imágenes, precios, agotados y grupos.
   Corregir primero las referencias duplicadas, como `RN0000`, en el catálogo de origen mediante el flujo administrativo habitual.
4. **Pixel/dataset:** en Administrador de eventos seleccionar o crear el origen web; copiar su ID al entorno
   correspondiente. En la configuración de eventos del catálogo asociar ese mismo origen y asignar permisos.
5. **Probar eventos:** usar la herramienta «Probar eventos» y, si procede, Pixel Helper. Aceptar consentimiento
   y comprobar PageView, ViewContent, Search, AddToCart, InitiateCheckout y AddPaymentInfo con la talla de precio distinto.
   Rechazar/retirar consentimiento y comprobar ausencia de envíos. Localhost permanece bloqueado por diseño;
   esta prueba real requiere una activación y publicación autorizadas, no datos inventados en producción.
6. **Purchase:** verificar un pago real confirmado o un entorno de integración de pruebas autorizado;
   contrastar total e IDs con el pedido y el feed. Comprobar que navegador/servidor comparten event_id y Meta
   los deduplica. Recargar éxito, repetir webhook y volver atrás no deben añadir una compra.
7. **Rechazos:** consultar Diagnóstico/Problemas del catálogo, identificar el ID afectado y corregir título,
   imagen pública, variante, moneda, precio o política en origen. Actualizar el feed y solicitar revisión cuando
   corresponda. No cambiar el ID para ocultar un rechazo y no alterar productos válidos para evitar políticas.
8. **Campaña:** en Ads Manager, nueva campaña de Ventas, con el catálogo y conjunto de productos correctos;
   elegir sitio web como destino/conversión cuando la cuenta lo permita. Seleccionar Pixel/evento Purchase
   solo después de validar la medición. Revisar presupuesto, público y ubicaciones sin publicar aún.
9. **Colección:** en el anuncio, elegir formato Colección si está disponible; agregar portada y texto;
   crear una Experiencia instantánea de tipo tienda/Storefront vinculada al catálogo o conjunto seleccionado.
10. **Destino de cada producto:** conservar los enlaces individuales `link` del feed; no sustituirlos por
    una URL genérica de inicio. Probar desde la vista previa móvil varios productos y tallas: debe abrir
    `/products/...?...variant=...` con la oferta correcta. La portada puede abrir la Experiencia instantánea;
    la ficha de producto debe conservar su enlace de salida a la tienda.
11. Revisar la vista previa de Facebook e Instagram y sus ubicaciones compatibles. Publicar una campaña
    paga requiere una autorización distinta; esta implementación no la crea ni la publica.

Referencias técnicas de Meta: [campos de producto, SDK oficial](https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/productitem.py),
[eventos CAPI y event_id, SDK oficial](https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/serverside/event.py).
El centro de ayuda/developers de Meta devolvió restricciones de acceso durante la revisión; la aceptación del
feed y la disponibilidad exacta de Colección/Storefront quedan por confirmar en la cuenta real.
