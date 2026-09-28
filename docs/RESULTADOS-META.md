# Resultado de implementación local de Meta

Actualización local: 27 de septiembre de 2026. En esta actualización no hubo commit, push, despliegue
ni cambios externos en Meta. Pixel y Conversions API permanecen desactivados en producción hasta
publicar el gestor de consentimiento y configurar las credenciales privadas.

## Entregado

- Feed XML automático con variantes, precios por talla, descuentos e inventario reales.
- Enlaces que seleccionan la variante exacta y contrato de identificadores compartido con eventos.
- Pixel preparado para PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo y Purchase,
  con bloqueo por configuración y consentimiento real.
- CAPI centralizada en Render para Purchase confirmado, con hashing, `_fbp`/`_fbc`, deduplicación,
  reintentos e idempotencia; el token existe únicamente en el servidor.
- Corrección del adaptador de pedidos para conservar `accessToken` y consultar el pedido autenticadamente.
- Gestor de consentimiento con aceptación/rechazo explícitos, preferencias, persistencia versionada,
  retirada, limpieza de cookies Meta y revocación de la atribución pendiente del pedido en el servidor.
- Política de cookies, política de privacidad ampliada y acceso permanente a preferencias desde el pie de página.
- No se migraron datos ni se modificaron productos de producción.

El listado de archivos y funciones, variables de entorno y pasos detallados de Commerce Manager,
Ads Manager, Colección y Experiencia instantánea están en [META-CATALOGO.md](META-CATALOGO.md).
Este informe también es un archivo nuevo de la entrega. Los demás cambios anteriores del espacio
de trabajo no deben confundirse con esta implementación.

## Pruebas

| Verificación | Resultado |
| --- | --- |
| Frontend completo | 15 suites, 93 pruebas aprobadas |
| Functions: pruebas unitarias | 44 aprobadas |
| Backend Render: pasarelas, inventario y CAPI | 21 aprobadas |
| Integración en emuladores | No ejecutada: el proceso Java local no pudo crear su conexión loopback |
| Compilación de producción | Aprobada; advertencias existentes de lint y datos de navegadores desactualizados |
| `git diff --check` | Aprobado |

Total ejecutado en esta actualización: 158 pruebas aprobadas. Cubren IDs compartidos con el catálogo,
precio de talla plus, consentimiento bloqueado por defecto, persistencia de la elección, aceptación, rechazo,
retirada coordinada con el servidor, PageView SPA sin duplicados, AddToCart con inventario, AddPaymentInfo
con datos del servidor, Purchase verificado, hashing, token privado, reintentos e idempotencia.
No se enviaron eventos reales a Meta. El build estricto con `CI=true` se detuvo por advertencias ESLint
preexistentes; el build normal del proyecto terminó correctamente con esas advertencias visibles.

## Auditoría pública de solo lectura

Consulta realizada el 27 de septiembre a las 00:44 UTC:

- 101 documentos de producto examinados; 1.160 variantes exportables con IDs únicos.
- Dos registros de referencia duplicada `RN0000` excluidos; requieren revisión del origen.
- 407 variantes agotadas se conservan como `out of stock`.
- Las 1.160 filas contienen promoción según los campos actuales de precio anterior/actual.
  Esto refleja los datos de la tienda; conviene confirmar comercialmente que sigan vigentes.
- Ninguna variante adicional excluida por fallo HTTP/tipo de imagen.
- Ocho enlaces públicos muestreados respondieron HTTP 200 con la aplicación.
- El XML generado se pudo analizar correctamente.

Archivos: `outputs/meta/audit.json` y `outputs/meta/catalog.local.xml`.
Los enlaces públicos prueban las rutas existentes; la selección nueva de variante se verificó
localmente, porque no está desplegada. La validación HTTP de imágenes no certifica calidad visual
ni aceptación por Meta. No se ha importado el feed en Commerce Manager.

## Pendientes, en orden

1. Revisar los textos de privacidad/cookies y validar el flujo publicado de aceptar, rechazar, retirar y
   recordar la elección. Mantener ambas integraciones apagadas hasta la publicación autorizada.
2. Colocar los valores reales siguiendo los ejemplos `.env.meta.example` y
   `render-backend/.env.example`. El token de CAPI pertenece al entorno privado de Render, nunca a React.
3. Revisar y autorizar una futura publicación. La copia `render-backend/` está ignorada por el Git
   principal: su cambio de confirmación de pago debe entregarse por separado al backend de Render.
4. Tras publicar con autorización, verificar `https://dleongold.com/meta/catalog.xml`, importar
   el feed, asociar Pixel y probar eventos y deduplicación en la cuenta real.
5. Configurar Colección y Experiencia instantánea con enlaces individuales del feed.
   La creación/publicación de campañas pagas requiere autorización aparte.

La URL del feed ya existe por la publicación anterior; esta actualización local de Pixel/CAPI y consentimiento
aún no está desplegada. No activar Meta solo por introducir un Pixel ID: frontend, backend y consentimiento
deben publicarse juntos y validarse en el sitio real.
