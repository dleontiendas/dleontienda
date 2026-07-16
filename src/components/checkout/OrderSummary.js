import React from "react";
import PaymentGateway from "../payments/PaymentGateway";

export default function OrderSummary({
  summary,
  actions,
}) {
  const {
    cart,
    subtotal,
    shipping,
    total,
  } = summary;

  const {
    loading,
    paymentData,
    paymentError,
    onSubmit,
    onWhatsApp,
  } = actions;

  return (
    <aside className="checkout-summary checkout-card">

      <div className="checkout-card-header">
        <span className="checkout-icon">🛒</span>

        <div>
          <h2>Resumen del pedido</h2>

          <p>
            Verifica tu compra antes de finalizar.
          </p>
        </div>
      </div>

      <div className="summary-products">

        {cart.map((item) => (
          <div
            className="summary-item"
            key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
          >
            <div>
              <strong>{item.name}</strong>

              <small>
                Cantidad: {item.quantity}
              </small>

              {item.selectedColor && (
                <small>
                  Color: {item.selectedColor}
                </small>
              )}

              {item.selectedSize && (
                <small>
                  Talla: {item.selectedSize}
                </small>
              )}
            </div>

            <strong>
              $
              {Number(item.price_cop).toLocaleString(
                "es-CO"
              )}
            </strong>
          </div>
        ))}

      </div>

      <hr />

      <div className="summary-total">

        <div>
          <span>Subtotal</span>

          <strong>
            ${subtotal.toLocaleString("es-CO")}
          </strong>
        </div>

        <div>
          <span>Envío</span>

          <strong>
            ${shipping.toLocaleString("es-CO")}
          </strong>
        </div>

        <div className="summary-grand-total">
          <span>Total</span>

          <strong>
            ${total.toLocaleString("es-CO")}
          </strong>
        </div>

      </div>

      <button
        className="btn-primary"
        //disabled={loading}
        disabled={loading}
        onClick={onSubmit}
      >
        {loading
          ? "Procesando..."
          : "Finalizar compra"}
      </button>

      <PaymentGateway
        paymentData={paymentData}
        loading={loading}
        error={paymentError}
      />

      <button
        className="btn-whatsapp"
        onClick={onWhatsApp}
      >
        Comprar por WhatsApp
      </button>

      <div className="checkout-benefits">
        <div>🔒 Compra segura</div>
        <div>🚚 Envíos nacionales</div>
        <div>💬 Soporte por WhatsApp</div>
      </div>

    </aside>
  );
}