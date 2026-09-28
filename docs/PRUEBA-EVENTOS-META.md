# Prueba de Meta Pixel y Conversions API

Esta guía corresponde al dataset/Pixel `1626841235767150`. La integración local y su gestor de
consentimiento todavía no están publicados. El gestor llama `setMetaConsent(true)` solamente después
de aceptar marketing y `setMetaConsent(false)` al rechazar o retirar esa decisión.

## Preparación de un entorno de prueba publicado

1. En **Administrador de eventos**, abre **Orígenes de datos** y selecciona `1626841235767150`.
2. Abre **Probar eventos**. En **Probar eventos del servidor**, copia el código temporal mostrado.
3. En el entorno privado de Render configura `META_PIXEL_ID=1626841235767150`, el token real en
   `META_CAPI_ACCESS_TOKEN` y el código temporal en `META_TEST_EVENT_CODE`. Nunca copies el token al
   frontend, a Git o a una captura compartida.
4. En el build de React configura `REACT_APP_META_ENABLED=true` y
   `REACT_APP_META_PIXEL_ID=1626841235767150`.
5. Publica ambos repositorios solamente después de una autorización específica. Abre el sitio desde
   **Probar eventos del navegador → Abrir sitio web** y acepta marketing en el gestor de consentimiento.
6. Mantén abierta la pestaña **Probar eventos**. Los eventos pueden tardar unos minutos en aparecer.

## Recorrido de cada evento

1. **PageView:** abre la página de inicio. Navega a Moda, luego Bolsos y usa Atrás. Debe aparecer un
   PageView por cada entrada de navegación; React StrictMode o un render repetido no debe crear otro.
2. **ViewContent:** abre un producto desde
   `https://dleongold.com/meta/catalog.xml`. Usa una URL cuyo parámetro `variant` seleccione una talla
   concreta. Comprueba `content_ids`, `value` y `currency=COP` contra esa fila del XML.
3. **Search:** ejecuta una búsqueda con Enter, con el botón y seleccionando un resultado. El evento
   incluye los IDs de productos encontrados y no transmite el texto libre buscado.
4. **AddToCart:** elige color y talla con inventario y agrega el producto. Comprueba ID, cantidad,
   precio de esa talla y valor. Repite hasta agotar la existencia disponible: el intento rechazado no
   debe producir un evento.
5. **InitiateCheckout:** entra al checkout con el carrito anterior. Debe aparecer una sola vez con todos
   los IDs, cantidades y precios del carrito.
6. **AddPaymentInfo:** completa los datos, selecciona Wompi, Addi o Sistecrédito y pulsa el botón que
   confirma el método/inicia el pago. El evento debe incluir `payment:<orderId>` como `event_id` y los
   importes que Firebase volvió a validar. Cargar el checkout sin confirmar no debe enviarlo.
7. **Purchase:** completa un pago aprobado en un ambiente autorizado de la pasarela. Espera la
   confirmación del webhook o la consulta verificada del proveedor. Deben verse las fuentes navegador
   y servidor para Purchase con el mismo `purchase:<orderId>`. Abrir o recargar la página de éxito,
   repetir el webhook y volver con Atrás no deben contar compras adicionales.

## Comprobaciones en Administrador de eventos

1. Abre cada evento y compara `event_id`, `content_ids`, `contents`, `value`, `currency` y `order_id`.
2. Copia uno de los `content_ids`, búscalo en el XML y luego en Commerce Manager. Debe ser idéntico,
   incluidos el prefijo `v:` o `l:` y la codificación de la referencia.
3. En **Información general** revisa Purchase después de procesarse: las copias de navegador y servidor
   deben deduplicarse. Revisa también **Calidad de coincidencia de eventos** y **Diagnóstico**.
4. Repite el recorrido rechazando marketing: no debe cargarse `fbevents.js`, aparecer eventos de
   navegador ni guardarse atribución Meta en un pedido nuevo.
5. Al terminar, elimina `META_TEST_EVENT_CODE` de Render y vuelve a desplegar. Conserva
   `META_CAPI_ACCESS_TOKEN` únicamente en el entorno secreto del servicio.

Si Meta muestra un rechazo, anota el nombre del evento, hora, `event_id` y mensaje técnico. No copies
tokens, correo, teléfono, cookies ni el cuerpo completo del evento en tickets o registros compartidos.
