import { Link } from "react-router-dom";
import "./Legal.css";

export default function Privacidad() {
  return (
    <main className="legal-page">
      <h1>Política de privacidad</h1>
      <p><strong>Última actualización:</strong> 27 de septiembre de 2026.</p>
      <p>
        Esta política explica cómo D’LEON GOLD trata la información necesaria para atender consultas,
        procesar pedidos, gestionar pagos y, cuando existe una autorización separada, medir publicidad.
      </p>
      <h2>Datos tratados</h2>
      <p>
        Según la función utilizada podemos tratar nombre, correo, teléfono, documento solicitado por la
        pasarela, dirección de entrega, productos comprados, importe, estado del pedido y datos técnicos
        básicos de conexión. No enviamos a Meta direcciones, documentos ni datos de pago.
      </p>
      <h2>Finalidades</h2>
      <ul>
        <li>Validar inventario, preparar y entregar pedidos.</li>
        <li>Iniciar pagos y comprobar su aprobación con la pasarela seleccionada.</li>
        <li>Atender solicitudes, garantías y obligaciones comerciales.</li>
        <li>Con autorización de marketing, medir anuncios mediante Meta Pixel y Conversions API.</li>
      </ul>
      <h2>Marketing y destinatarios</h2>
      <p>
        Cuando aceptas marketing, los eventos pueden incluir IDs de catálogo, importes, cookies de atribución,
        IP, agente de usuario y correo o teléfono normalizados y cifrados. Meta Platforms actúa como proveedor
        de medición publicitaria. Consulta los detalles y cambia tu elección en la <Link to="/cookies">política de cookies</Link>.
      </p>
      <h2>Derechos y contacto</h2>
      <p>
        Puedes solicitar información, actualización, corrección o supresión cuando corresponda, y retirar
        el consentimiento de marketing desde “Cambiar preferencias de cookies”. Para otras solicitudes escribe
        a dleongold@dleongold.com.
      </p>
      <h2>Seguridad y conservación</h2>
      <p>
        Aplicamos controles de acceso y evitamos exponer tokens de pago o credenciales publicitarias al
        navegador. Conservamos la información durante el tiempo necesario para las finalidades indicadas y
        las obligaciones aplicables.
      </p>
    </main>
  );
}
