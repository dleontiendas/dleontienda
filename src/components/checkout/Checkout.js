import React, {
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import M from "materialize-css";
import {
  serverTimestamp,
} from "firebase/firestore";

import { CartContext } from "../../context/CartContext";
import { processCheckout } from "../../services/checkoutService";
import { startPayment } from "../../services/paymentService";
import {
  PAYMENT_PROVIDER_MAP,
} from "../../utils/paymentProviderMap";
import "./Checkout.css";

const paymentProvider =
  PAYMENT_PROVIDER_MAP[
    paymentMethod
  ];


const Checkout = () => {
  const {
    cart,
    clearCart,
    subtotal,
  } = useContext(CartContext);

  const provider =
  PAYMENT_PROVIDER_MAP[
    paymentMethod.toUpperCase()
  ];

if (!provider) {
  throw new Error(
    `Proveedor inválido: ${paymentMethod}`
  );
}

const payload = {
  orderId,
};

const response =
  await startPayment(
    provider,
    payload
  );

  const navigate = useNavigate();

  const [shipping] = useState(15900);

  const [paymentMethod, setPaymentMethod] =
    useState("contraentrega");

  const [wompiType, setWompiType] =
    useState("PSE");

  const [boldType, setBoldType] =
    useState("CARD");

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState({
      email: "",
      first_name: "",
      last_name: "",
      document: "",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      phone: "",
    });

  useEffect(() => {
    M.AutoInit();
  }, []);

  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (loading) return;

    if (!cart.length) {
      M.toast({
        html: "Tu carrito está vacío",
      });
      return;
    }

    if (
      !formData.email ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.phone ||
      !formData.address ||
      !formData.city
    ) {
      M.toast({
        html:
          "Completa todos los datos requeridos",
      });
      return;
    }

    setLoading(true);

    try {
      const order = {
        customer: {
          ...formData,
        },

        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price_cop,
          quantity: item.quantity,
          color:
            item.selectedColor || null,
          size:
            item.selectedSize || null,
        })),

        subtotal,
        shipping,
        total,

        paymentMethod,

        paymentProvider:
          paymentMethod ===
          "contraentrega"
            ? "CASH"
            : paymentMethod.toUpperCase(),

        wompiType,
        boldType,

        status: "Initiated",
        paymentStatus: "PENDING",

        externalId: null,
        providerData: {},

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      const { id: orderId } =
        await processCheckout(order);

      localStorage.setItem(
        "lastOrderId",
        orderId
      );

      /*
       |----------------------------------------
       | Contra entrega
       |----------------------------------------
       */

      if (
        paymentMethod ===
        "contraentrega"
      ) {
        clearCart();

        navigate(
          `/checkout-success?ref=${orderId}`
        );

        return;
      }

      /*
       |----------------------------------------
       | Iniciar pago backend
       |----------------------------------------
       */

      const payload = {
  orderId,

  customer: {
    email: formData.email,
    phone: formData.phone,
    name: `${formData.first_name} ${formData.last_name}`,
  },

  metadata: {
    wompiType,
    boldType,
  },

  returnUrl:
    `${window.location.origin}/checkout/success`,
};

      const response =
        await startPayment(
          paymentMethod,
          payload
        );

      console.log(
        "Payment response:",
        response
      );

      /*
       |----------------------------------------
       | Redirect pasarelas
       |----------------------------------------
       */

      if (response?.redirectUrl) {
        window.location.href =
          response.redirectUrl;

        return;
      }

      /*
       |----------------------------------------
       | Sistecrédito
       |----------------------------------------
       */

      if (
        response?.applicationId
      ) {
        navigate(
          `/checkout-success?ref=${orderId}&applicationId=${response.applicationId}`
        );

        return;
      }

      /*
       |----------------------------------------
       | Backend temporal
       |----------------------------------------
       */

      if (response?.success) {
        M.toast({
          html:
            "Integración de pago preparada. Backend conectado correctamente.",
        });

        return;
      }

      throw new Error(
        "El backend no devolvió una respuesta válida."
      );
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      M.toast({
        html:
          error?.response?.data
            ?.message ||
          error?.message ||
          "Error procesando el pago",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const phoneNumber =
      "573104173201";

    const message =
      encodeURIComponent(
        `Nuevo pedido\n\n` +
          `${formData.first_name} ${formData.last_name}\n` +
          `${formData.email}\n` +
          `${formData.phone}\n` +
          `${formData.address}, ${formData.city}\n\n` +
          cart
            .map(
              (item) =>
                `• ${item.name} x${item.quantity} - $${Number(
                  item.price_cop
                ).toLocaleString(
                  "es-CO"
                )}`
            )
            .join("\n") +
          `\n\nTotal: $${total.toLocaleString(
            "es-CO"
          )}`
      );

    window.open(
      `https://wa.me/${phoneNumber}?text=${message}`,
      "_blank"
    );
  };

  return (
    <div className="checkout-page">

      <div className="checkout-form">
        <h3>Datos del comprador</h3>

        <label>Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <div className="checkout-row">
          <div>
            <label>Nombre</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
          </div>
          <div>
            <label>Apellidos</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
          </div>
        </div>

        <label>Cédula</label>
        <input type="text" name="document" value={formData.document} onChange={handleChange} required />

        <label>Dirección</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} required />

        <div className="checkout-row">
          <div>
            <label>Ciudad</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
          </div>
          <div>
            <label>Departamento</label>
            <input type="text" name="province" value={formData.province} onChange={handleChange} />
          </div>
        </div>

        <label>Teléfono</label>
        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />

        <div className="payment-section">
          <h4>Método de pago</h4>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="contraentrega"
                checked={paymentMethod === "contraentrega"}
                onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Pago contra entrega</span>
            </label>
          </p>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="addi"
                checked={paymentMethod === "addi"}
                onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Financiación con ADDI</span>
            </label>
          </p>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="sistecredito"
                checked={paymentMethod === "sistecredito"}
                onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Financiación con Sistecrédito</span>
            </label>
          </p>

          <p>
            <label>
              <input name="paymentMethod" type="radio" value="wompi"
                checked={paymentMethod === "wompi"}
                onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Pago electrónico (Wompi)</span>
            </label>
          </p>

          {paymentMethod === "wompi" && (
            <div style={{ marginLeft: "25px", marginTop: "10px" }}>
              {[["PSE", "PSE"], ["CARD", "Tarjeta"], ["NEQUI", "Nequi"]].map(([val, label]) => (
                <p key={val}>
                  <label>
                    <input name="wompiType" type="radio" value={val}
                      checked={wompiType === val}
                      onChange={(e) => setWompiType(e.target.value)} />
                    <span>{label}</span>
                  </label>
                </p>
              ))}
            </div>
          )}

          {/* ── BOLD ── */}
          <p>
            <label>
              <input name="paymentMethod" type="radio" value="bold"
                checked={paymentMethod === "bold"}
                onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>Pago con Bold</span>
            </label>
          </p>

          {paymentMethod === "bold" && (
            <div style={{ marginLeft: "25px", marginTop: "10px" }}>
              {[["CARD", "Tarjeta crédito / débito"], ["NEQUI", "Nequi"], ["PSE", "PSE"]].map(([val, label]) => (
                <p key={val}>
                  <label>
                    <input name="boldType" type="radio" value={val}
                      checked={boldType === val}
                      onChange={(e) => setBoldType(e.target.value)} />
                    <span>{label}</span>
                  </label>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="checkout-summary">
        <h3>
          Resumen del Pedido
        </h3>

        <ul>
          {cart.map((item) => (
            <li
              key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
            >
              <span>
                {item.name} x
                {item.quantity}
              </span>

              <span>
                $
                {Number(
                  item.price_cop
                ).toLocaleString(
                  "es-CO"
                )}
              </span>
            </li>
          ))}
        </ul>

        <hr />

        <p>
          Subtotal
          <strong>
            $
            {subtotal.toLocaleString(
              "es-CO"
            )}
          </strong>
        </p>

        <p>
          Envío
          <strong>
            $
            {shipping.toLocaleString(
              "es-CO"
            )}
          </strong>
        </p>

        <h4>
          Total $
          {total.toLocaleString(
            "es-CO"
          )}
        </h4>

        <button
          type="button"
          className="btn-primary"
          onClick={
            handleSubmit
          }
          disabled={loading}
        >
          {loading
            ? "Procesando..."
            : "Finalizar compra"}
        </button>

        <button
          type="button"
          className="btn-whatsapp"
          onClick={
            handleWhatsAppOrder
          }
        >
          Comprar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default Checkout;