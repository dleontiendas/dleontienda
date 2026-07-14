import React from "react";

export default function RecipientSwitch({
  checked,
  onChange,
}) {
  return (
    <section className="checkout-card">
      <label className="recipient-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) =>
            onChange(e.target.checked)
          }
        />

        <span className="recipient-slider"></span>

        <div className="recipient-content">
          <h3>
            El pedido será recibido por otra persona
          </h3>

          <p>
            Activa esta opción únicamente si la
            persona que recibirá el pedido tiene
            datos de contacto o dirección
            diferentes al comprador.
          </p>
        </div>
      </label>
    </section>
  );
}