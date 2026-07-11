import React, {
  useContext,
  useState,
  useEffect,
} from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import M from "materialize-css";

import { db } from "../../Firebase";

import { CartContext } from "../../context/CartContext";

import { startPayment } from "../../services/paymentService";

import { PAYMENT_PROVIDER_MAP } from "../../components/utils/paymentProviderMap";

import PaymentGateway from "../payments/PaymentGateway";

import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } =
    useContext(CartContext);

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [paymentData, setPaymentData] =
    useState(null);

  const [paymentError, setPaymentError] =
    useState(null);

  const [shipping] =
    useState(15900);

  const [paymentMethod, setPaymentMethod] =
    useState("contraentrega");

  const [wompiType, setWompiType] =
    useState("PSE");

  const [boldType, setBoldType] =
    useState("CARD");

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

  const subtotal = cart.reduce(
    (acc, item) =>
      acc +
      (item.price_cop || 0) *
        (item.quantity || 1),
    0
  );

  const total =
    subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setPaymentError(null);

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

    if (
      ["addi", "sistecredito"].includes(
        paymentMethod
      ) &&
      !formData.document
    ) {
      M.toast({
        html:
          "La cédula es obligatoria para este método de pago.",
      });

      return;
    }

    setLoading(true);

    try {
      const order = {
        customer: formData,

        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price_cop,
          quantity: item.quantity,
          color:
            item.selectedColor,
          size:
            item.selectedSize,
        })),

        subtotal,

        shipping,

        total,

        paymentMethod,

        paymentProvider:
          PAYMENT_PROVIDER_MAP[
            paymentMethod
          ],

        wompiType,

        boldType,

        status: "Initiated",

        paymentStatus:
          "PENDING",

        externalId: null,

        providerData: {},

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      const docRef =
        await addDoc(
          collection(
            db,
            "orders"
          ),
          order
        );

      if (
        paymentMethod ===
        "contraentrega"
      ) {
        clearCart();

        navigate(
          `/checkout-success?ref=${docRef.id}`
        );

        return;
      }

      const provider =
        PAYMENT_PROVIDER_MAP[
          paymentMethod
        ];

      const paymentResponse =
        await startPayment(
          provider,
          {
            orderId:
              docRef.id,

            customer:
              formData,

            metadata: {
              wompiType,
              boldType,
            },

            returnUrl:
              `${window.location.origin}/checkout-success?ref=${docRef.id}`,
          }
        );

      setPaymentData(
        paymentResponse
      );
    } catch (error) {
      console.error(error);

      setPaymentError(
        error.message ||
          "Error procesando el pago."
      );

      M.toast({
        html:
          error.message ||
          "Error procesando el pago.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder =
    () => {
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

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="checkout-row">
          <div>
            <label>Nombre</label>

            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Apellidos</label>

            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <label>Cédula</label>

        <input
          type="text"
          name="document"
          value={formData.document}
          onChange={handleChange}
        />

        <label>Dirección</label>

        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <div className="checkout-row">
          <div>
            <label>Ciudad</label>

            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Departamento</label>

            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={handleChange}
            />
          </div>
        </div>

        <label>Teléfono</label>

        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <div className="payment-section">
          <h4>Método de pago</h4>

          <p>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="contraentrega"
                checked={
                  paymentMethod ===
                  "contraentrega"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span>
                Pago contra entrega
              </span>
            </label>
          </p>

          <p>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="addi"
                checked={
                  paymentMethod ===
                  "addi"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span>
                Financiación con ADDI
              </span>
            </label>
          </p>

          <p>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="sistecredito"
                checked={
                  paymentMethod ===
                  "sistecredito"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span>
                Financiación con
                Sistecrédito
              </span>
            </label>
          </p>

          <p>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="wompi"
                checked={
                  paymentMethod ===
                  "wompi"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span>
                Pago con Wompi
              </span>
            </label>
          </p>

          {paymentMethod ===
            "wompi" && (
            <div
              style={{
                marginLeft: 25,
                marginTop: 10,
              }}
            >
              {[
                ["PSE", "PSE"],
                [
                  "CARD",
                  "Tarjeta",
                ],
                [
                  "NEQUI",
                  "Nequi",
                ],
              ].map(
                ([value, label]) => (
                  <p key={value}>
                    <label>
                      <input
                        type="radio"
                        name="wompiType"
                        value={value}
                        checked={
                          wompiType ===
                          value
                        }
                        onChange={(e) =>
                          setWompiType(
                            e.target
                              .value
                          )
                        }
                      />

                      <span>
                        {label}
                      </span>
                    </label>
                  </p>
                )
              )}
            </div>
          )}

          <p>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="bold"
                checked={
                  paymentMethod ===
                  "bold"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span>
                Pago con Bold
              </span>
            </label>
          </p>

          {paymentMethod ===
            "bold" && (
            <div
              style={{
                marginLeft: 25,
                marginTop: 10,
              }}
            >
              {[
                [
                  "CARD",
                  "Tarjeta",
                ],
                [
                  "NEQUI",
                  "Nequi",
                ],
                [
                  "PSE",
                  "PSE",
                ],
              ].map(
                ([value, label]) => (
                  <p key={value}>
                    <label>
                      <input
                        type="radio"
                        name="boldType"
                        value={value}
                        checked={
                          boldType ===
                          value
                        }
                        onChange={(e) =>
                          setBoldType(
                            e.target
                              .value
                          )
                        }
                      />

                      <span>
                        {label}
                      </span>
                    </label>
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
       <div className="checkout-summary">
        <h3>Resumen del pedido</h3>

        <ul>
          {cart.map((item) => (
            <li
              key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
            >
              <span>
                {item.name} x{item.quantity}
              </span>

              <span>
                $
                {Number(
                  item.price_cop
                ).toLocaleString("es-CO")}
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

          {total.toLocaleString("es-CO")}
        </h4>

        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={handleSubmit}
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
          type="button"
          className="btn-whatsapp"
          onClick={() => {
            handleWhatsAppOrder();
            clearCart();
          }}
        >
          Comprar por WhatsApp
        </button>
      </div>
    </div>
    
  );
};

export default Checkout;