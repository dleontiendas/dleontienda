import React from "react";

export default function ShippingForm({
  shipping,
  setShipping,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setShipping((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <section className="checkout-card">
      <div className="checkout-card-header">
        <span className="checkout-icon">📦</span>

        <div>
          <h2>Datos de envío</h2>

          <p>
            Completa la información de la persona que
            recibirá el pedido.
          </p>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="checkout-field">
          <label>Nombre</label>

          <input
            type="text"
            name="first_name"
            value={shipping.first_name}
            onChange={handleChange}
            placeholder="Nombre de quien recibe"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Apellidos</label>

          <input
            type="text"
            name="last_name"
            value={shipping.last_name}
            onChange={handleChange}
            placeholder="Apellidos de quien recibe"
            required
          />
        </div>

        <div className="checkout-field full">
          <label>Teléfono</label>

          <input
            type="tel"
            name="phone"
            value={shipping.phone}
            onChange={handleChange}
            placeholder="3101234567"
            required
          />
        </div>

        <div className="checkout-field full">
          <label>Dirección</label>

          <input
            type="text"
            name="address"
            value={shipping.address}
            onChange={handleChange}
            placeholder="Cra 40 #48-31"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Ciudad</label>

          <input
            type="text"
            name="city"
            value={shipping.city}
            onChange={handleChange}
            placeholder="Ciudad"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Departamento</label>

          <input
            type="text"
            name="province"
            value={shipping.province}
            onChange={handleChange}
            placeholder="Departamento"
            required
          />
        </div>

        <div className="checkout-field full">
          <label>Barrio / Referencia</label>

          <input
            type="text"
            name="reference"
            value={shipping.reference}
            onChange={handleChange}
            placeholder="Barrio, conjunto, referencia..."
          />
        </div>
      </div>

      <div className="checkout-info">
        ℹ Puedes usar datos distintos si otra persona
        recibirá el pedido.
      </div>
    </section>
  );
}