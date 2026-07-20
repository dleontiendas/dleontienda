import React, { useContext, useEffect, useState } from "react";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import M from "materialize-css";

import { db } from "../../Firebase";

import { CartContext } from "../../context/CartContext";

import { startPayment } from "../../services/paymentService";

import { PAYMENT_PROVIDER_MAP } from "../../components/utils/paymentProviderMap";

import BuyerForm from "./BuyerForm";
import ShippingForm from "./ShippingForm";
import RecipientSwitch from "./RecipientSwitch";
import PaymentMethods from "./PaymentMethods";
import OrderSummary from "./OrderSummary";
import {
  buildWhatsAppMessage,
  openWhatsApp,
} from "./checkout.utils";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [paymentData, setPaymentData] = useState(null);

  const [paymentError, setPaymentError] = useState(null);

  const [shipping] = useState(25000);

  const [paymentMethod, setPaymentMethod] = useState("wompi");

  const [wompiType, setWompiType] = useState("PSE");

  const [boldType, setBoldType] = useState("CARD");

  const emptyPerson = {
    email: "",
    first_name: "",
    last_name: "",
    document: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    reference: "",
  };

  const [customer, setCustomer] = useState(emptyPerson);

  const [shippingData, setShippingData] = useState(emptyPerson);

  const [differentRecipient, setDifferentRecipient] = useState(false);

  useEffect(() => {
    M.AutoInit();
  }, []);

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price_cop || 0) * (item.quantity || 1),
    0,
  );

  const total = subtotal + shipping;

  const shippingInfo = differentRecipient ? shippingData : customer;

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
      !customer.email ||
      !customer.first_name ||
      !customer.last_name ||
      !customer.phone ||
      !shippingInfo.address ||
      !shippingInfo.city
    ) {
      M.toast({
        html: "Completa todos los datos requeridos",
      });

      return;
    }

    if (
  ["wompi", "addi", "sistecredito"].includes(paymentMethod) &&
  !customer.document.trim()
) {
  M.toast({
    html: "Ingresa la cédula del comprador para continuar con el pago.",
  });

  return;
}

    setLoading(true);

    try {
      const order = {
        customer,

        shipping: shippingInfo,

        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price_cop,
          quantity: item.quantity,
          color: item.selectedColor,
          size: item.selectedSize,
        })),

        subtotal,

        shipping,

        total,

        paymentMethod,

        paymentProvider: PAYMENT_PROVIDER_MAP[paymentMethod],

        wompiType,

        boldType,

        status: "Initiated",

        paymentStatus: "PENDING",

        externalId: null,

        providerData: {},

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), order);

      if (paymentMethod === "contraentrega") {
        clearCart();

        navigate(`/checkout-success?ref=${docRef.id}`);

        return;
      }

      const provider = PAYMENT_PROVIDER_MAP[paymentMethod];

      const paymentResponse = await startPayment(provider, {
        orderId: docRef.id,

        customer,

        shipping: shippingInfo,

        metadata: {
          wompiType,
          boldType,
        },

        returnUrl: `${window.location.origin}/checkout-success?ref=${docRef.id}`,
      });

      setPaymentData({
  ...paymentResponse,
  checkout: {
    ...paymentResponse.checkout,
    customerData: {
      ...(paymentResponse.checkout?.customerData || {}),
      legalId: customer.document.trim(),
      legalIdType: "CC",
    },
  },
  });
    } catch (error) {
      console.error(error);

      setPaymentError(error.message || "Error procesando el pago.");

      M.toast({
        html: error.message || "Error procesando el pago.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
  const message =
    buildWhatsAppMessage({
      customer,
      shipping: shippingInfo,
      cart,
      total,
    });

  openWhatsApp({
    phone: "573104173201",
    message,
  });
};
  return (
    <div className="checkout-page">
      <div className="checkout-left">
        <BuyerForm customer={customer} setCustomer={setCustomer} />

        <RecipientSwitch
          checked={differentRecipient}
          onChange={setDifferentRecipient}
        />

        {differentRecipient && (
          <ShippingForm shipping={shippingData} setShipping={setShippingData} />
        )}

        <PaymentMethods
          payment={{
            paymentMethod,
            setPaymentMethod,
            wompiType,
            setWompiType,
            boldType,
            setBoldType,
          }}
        />
      </div>

      <OrderSummary
        summary={{
          cart,
          subtotal,
          shipping,
          total,
        }}
        actions={{
          loading,
          paymentData,
          paymentError,
          onSubmit: handleSubmit,
          onWhatsApp: () => {
            handleWhatsAppOrder();
            clearCart();
          },
        }}
      />
    </div>
  );
};

export default Checkout;
