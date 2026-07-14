import React from "react";

export default function BuyerForm({
  customer,
  setCustomer,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <section className="checkout-card">
      <div className="checkout-card-header">
        <span className="checkout-icon">👤</span>

        <div>
          <h2>Datos del comprador</h2>

          <p>
            Completa la información de la persona que realiza la compra.
          </p>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="checkout-field full">
          <label>Email</label>

          <input
            type="email"
            name="email"
            value={customer.email}
            onChange={handleChange}
            placeholder="ejemplo@correo.com"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Nombre</label>

          <input
            type="text"
            name="first_name"
            value={customer.first_name}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Apellidos</label>

          <input
            type="text"
            name="last_name"
            value={customer.last_name}
            onChange={handleChange}
            placeholder="Tus apellidos"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Cédula</label>

          <input
            type="text"
            name="document"
            value={customer.document}
            onChange={handleChange}
            placeholder="Número de documento"
            required
          />
        </div>

        <div className="checkout-field">
          <label>Teléfono / WhatsApp</label>

          <input
            type="tel"
            name="phone"
            value={customer.phone}
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
            value={customer.address}
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
            value={customer.city}
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
            value={customer.province}
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
            value={customer.reference}
            onChange={handleChange}
            placeholder="Barrio, conjunto, referencia..."
          />
        </div>
      </div>
    </section>
  );
}