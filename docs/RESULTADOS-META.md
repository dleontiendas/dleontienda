# Resultado de implementación local de Meta

Fecha de cierre: 27 de septiembre de 2026. Sin push, despliegue ni cambios externos en Meta.
Pixel y Conversions API permanecen desactivados hasta resolver consentimiento.

## Entregado

- Feed XML automático con variantes, precios por talla, descuentos e inventario reales.
- Enlaces que seleccionan la variante exacta y contrato de identificadores compartido con eventos.
- Pixel preparado para los seis eventos solicitados, con bloqueo por configuración y consentimiento.
- CAPI Purchase preparado para pagos confirmados, con deduplicación, reintentos y token solo servidor.
- Corrección del adaptador de pedidos para conservar `accessToken` y consultar el pedido autenticadamente.
- No se migraron datos ni se modificaron productos de producción.

El listado de archivos y funciones, variables de entorno y pasos detallados de Commerce Manager,
Ads Manager, Colección y Experiencia instantánea están en [META-CATALOGO.md](META-CATALOGO.md).
Este informe también es un archivo nuevo de la entrega. Los demás cambios anteriores del espacio
de trabajo no deben confundirse con esta implementación.

## Pruebas

| Verificación | Resultado |
| --- | --- |
| Frontend completo | 17 suites, 101 pruebas aprobadas |
| Functions: pruebas unitarias | 54 aprobadas |
| Backend Render: pasarelas/inventario | 15 aprobadas |
| Integración en emuladores | 21 aprobadas |
| Reglas de Firestore en emulador | 6 aprobadas |
| Compilación de producción | Aprobada; advertencias existentes de lint y datos de navegadores desactualizados |
| `git diff --check` | Aprobado |

Total: 197 pruebas aprobadas. Se actualizaron el antiguo test de plantilla de App y dos fixtures
de inventario que carecían del precio requerido. Las pruebas cubren precio único, talla plus,
variantes, agotados, promoción, caracteres especiales, IDs duplicados, consentimiento desactivado,
deduplicación, token de pedido y confirmación de compra. No se enviaron eventos reales a Meta.
Los registros están en `tmp/meta-frontend-tests.log`, `tmp/meta-functions-tests.log`,
`tmp/meta-render-tests.log`, `tmp/meta-emulator-tests.log` y `tmp/meta-build.log`.

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

1. Implementar y validar consentimiento de marketing: aceptar, rechazar, retirar y recordar elección;
   coordinar la revocación con el servidor. Mantener ambas integraciones apagadas mientras tanto.
2. Revisar los dos productos con referencia `RN0000`, sin corregirlos automáticamente.
3. Colocar los valores reales siguiendo los ejemplos `.env.meta.example` y
   `functions/.env.meta.example`. El token de CAPI pertenece a Secret Manager, nunca a React.
4. Revisar y autorizar una futura publicación. La copia `render-backend/` está ignorada por el Git
   principal: su cambio de confirmación de pago debe entregarse por separado al backend de Render.
5. Tras publicar con autorización, verificar `https://dleongold.com/meta/catalog.xml`, importar
   el feed, asociar Pixel y probar eventos y deduplicación en la cuenta real.
6. Configurar Colección y Experiencia instantánea con enlaces individuales del feed.
   La creación/publicación de campañas pagas requiere autorización aparte.

La URL del feed está preparada, pero todavía no se ha publicado. No activar Meta solo por
introducir un Pixel ID; faltan consentimiento y verificación de extremo a extremo.
