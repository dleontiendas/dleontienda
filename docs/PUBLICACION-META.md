# Publicación autorizada de la integración Meta

27 de septiembre de 2026. El usuario autorizó GitHub, Firebase y Render con seguimiento desactivado.

## Alcance y verificación

- La referencia duplicada ya no aparece: auditoría de 101 productos, 1.166 variantes antes de validar imágenes,
  cero rechazos por datos/identidad. En esa consulta 20 variantes quedaron fuera por disponibilidad de imágenes;
  el feed las vuelve a comprobar automáticamente.
- Se reutilizó el checkout de publicación `category-navigation`, partiendo del commit publicado `72097d3`.
  Los cambios locales de Finanzas y de versionado de imágenes no se incluyeron en esta publicación.
- Frontend: 13 suites, 84 pruebas aprobadas. Functions: 46 aprobadas. Render: 15 aprobadas.
  Emulador de pedidos/Meta: 11 aprobadas. Reglas: 5 aprobadas. Total del conjunto publicado: 161.
  La cifra anterior de 197 incluía pruebas de otros cambios locales que no forman parte de esta entrega.
- Build de producción aprobado, con advertencias existentes de lint y datos de navegadores antiguos.
- GitHub tienda: `45060bb`, seguido de `82645f7`, que evita declarar el secreto cuando Meta está apagado.
- GitHub backend: `2c6a567d1793d089791d3a0a50cfb192c8a8f377`.
- Render confirmó ese commit como último despliegue correcto, estado **Live**.
- Firebase confirmó la creación de `metaCatalog` y `metaPurchase` y actualización de
  `createOrderWithReservation`, `getOrderStatus`, `productSharePreview` y `productShareImage`.
  Hosting también confirmó la publicación. No se desplegaron reglas ni funciones de Finanzas.

## Comprobación pública después del despliegue

- Feed: https://dleongold.com/meta/catalog.xml — HTTP 200, `application/xml; charset=utf-8`.
- XML válido: **1.166 variantes y 1.166 IDs únicos**. Las imágenes temporalmente excluidas
  en la revisión local respondieron correctamente desde el feed publicado.
- Inicio de la tienda y `/health` del backend: HTTP 200.
- Tres enlaces de variantes muestreados: HTTP 200, aplicación, URL de variante y metadatos de precio presentes.
- JavaScript público `main.9e989c98.js` coincide con el build probado.
- Navegador real: `DR0002`, Verde Militar / XXXL seleccionados, precio $59.000.
  Feed correspondiente: precio anterior 118000 COP y oferta 59000 COP. No se cargaron scripts de Facebook/Pixel.
- Evidencia local: `outputs/meta/published-audit.json` y `outputs/meta/catalog.published.xml`.
- No se hicieron pedidos, pagos reales ni eventos de prueba en Meta durante la comprobación pública.

## Seguimiento desactivado

El build se generó con `REACT_APP_META_ENABLED=false` y `REACT_APP_META_CONSENT_READY=false`.
Las Functions usan `META_ENABLED=false` y `META_CONSENT_READY=false`.
No se creó ningún token ficticio ni se activaron eventos publicitarios.

El secreto `META_ACCESS_TOKEN` se declara/vincula únicamente en un despliegue habilitado.
Para activar CAPI en el futuro se requieren consentimiento resuelto, valores reales, secreto en Secret Manager
y un nuevo despliegue; no basta con introducir el Pixel ID.

## Pendientes después de publicar

1. Implementar y validar consentimiento: aceptar/rechazar marketing, persistencia y retirada coordinada con servidor.
2. Configurar Pixel ID, versión API y token reales sin incluir secretos en GitHub o React.
3. Importar el feed en Commerce Manager, asociar el origen de eventos y probar la deduplicación en Meta.
4. Crear Colección/Experiencia instantánea únicamente con autorización para configurar publicidad.
5. Actualizar Node.js 20 antes de su retirada anunciada por Firebase para el 30 de octubre de 2026.

La guía `META-CATALOGO.md` describe los campos y pasos manuales. `RESULTADOS-META.md` conserva
el diagnóstico y pruebas iniciales, anteriores a esta autorización; este informe refleja la publicación posterior.
