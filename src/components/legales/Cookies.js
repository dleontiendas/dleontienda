import React from "react";
import { useCookieConsent } from "../../consent/ConsentContext";
import "./Legal.css";

export default function Cookies() {
  const consent = useCookieConsent();
  return (
    <main className="legal-page">
      <h1>Política de cookies</h1>
      <p><strong>Última actualización:</strong> 27 de septiembre de 2026.</p>
      <p>
        D’LEON GOLD utiliza almacenamiento del navegador para operar la tienda y, únicamente con tu
        autorización, tecnologías de Meta para medir el rendimiento de anuncios. Puedes comprar aunque
        rechaces las cookies de marketing.
      </p>
      <h2>Almacenamiento necesario</h2>
      <p>
        Guarda el carrito, el método de entrega, la sesión y el token que permite consultar de manera segura
        el estado de un pedido. Es necesario para prestar las funciones que solicitas y no se utiliza para
        crear audiencias publicitarias.
      </p>
      <h2>Marketing de Meta</h2>
      <p>
        Si lo autorizas, cargamos Meta Pixel y podemos usar los identificadores <code>_fbp</code> y
        <code> _fbc</code>. Medimos páginas visitadas, productos vistos, búsquedas, productos agregados,
        inicio del checkout, selección del medio de pago y compras confirmadas. El servidor puede enviar
        a Meta información normalizada y cifrada, como correo o teléfono, junto con datos técnicos de la
        conexión, exclusivamente para medición y atribución publicitaria.
      </p>
      <h2>Tu elección</h2>
      <p>
        Registramos en este navegador la categoría elegida, la versión de este aviso y la fecha de la decisión.
        Al retirar marketing detenemos eventos futuros, solicitamos la revocación en pedidos pendientes y
        eliminamos las cookies de Meta que sean accesibles desde este sitio. La retirada no puede recuperar
        información que ya hubiera sido transmitida antes de cambiar la elección.
      </p>
      <p>
        Tu estado actual es: <strong>{consent.decided ? (consent.marketing ? "marketing autorizado" : "marketing rechazado") : "sin decidir"}</strong>.
      </p>
      <button type="button" className="legal-action" onClick={consent.openPreferences}>Cambiar preferencias de cookies</button>
      <h2>Contacto</h2>
      <p>Para consultas sobre privacidad puedes escribir a dleongold@dleongold.com.</p>
    </main>
  );
}
