import React, { useContext, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import M from "materialize-css";

import { CartContext } from "../../context/CartContext";
import { createOrder } from "../../api/ordersApi";

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
import { getEmailProductImage } from "../utils/productImage";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [paymentData, setPaymentData] = useState(null);

  const [paymentError, setPaymentError] = useState(null);

  const [shipping] = useState(25000);

  const [paymentMethod, setPaymentMethod] = useState("");

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

    if (!paymentMethod) {
      M.toast({
        html: "Selecciona un mÃ©todo de pago",
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

        shippingAddress: shippingInfo,

        items: cart.map((item) => ({
          productId: item.id,
          catSlug: item.catSlug,
          skuMaster: (item.variants || [])
            .find((variant) => variant.color === item.selectedColor)
            ?.tallas?.find((size) => String(size.size) === String(item.selectedSize))
            ?.sku_master || "",
          quantity: item.quantity,
          color: item.selectedColor,
          size: item.selectedSize,
          image: getEmailProductImage(item, item.selectedColor),
        })),

        subtotal,

        shipping,

        total,

        paymentMethod,

        paymentProvider: PAYMENT_PROVIDER_MAP[paymentMethod],

        wompiType,

        boldType,

      };

      const createdOrder = await createOrder(order);
      const orderId = createdOrder.id;
      localStorage.setItem(`orderAccessToken:${orderId}`, createdOrder.accessToken);
      localStorage.setItem("lastOrderId", orderId);

      if (paymentMethod === "contraentrega") {
        clearCart();

        navigate(`/checkout-success?ref=${orderId}`);

        return;
      }

      const provider = PAYMENT_PROVIDER_MAP[paymentMethod];

      const paymentResponse = await startPayment(provider, {
        orderId,

        customer,

        shipping: shippingInfo,

        metadata: {
          wompiType,
          boldType,
        },

        returnUrl: `${window.location.origin}/checkout-success?ref=${orderId}`,
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

  const handleWhatsAppOrder = async () => {
    if (!cart.length) return;
    setLoading(true);
    try {
      const createdOrder = await createOrder({
        customer,
        shippingAddress: shippingInfo,
        items: cart.map((item) => ({
          productId: item.id,
          catSlug: item.catSlug,
          skuMaster: (item.variants || [])
            .find((variant) => variant.color === item.selectedColor)
            ?.tallas?.find((size) => String(size.size) === String(item.selectedSize))
            ?.sku_master || "",
          quantity: item.quantity,
          color: item.selectedColor,
          size: item.selectedSize,
          image: getEmailProductImage(item, item.selectedColor),
        })),
        shipping,
        paymentMethod: "whatsapp",
        paymentProvider: "WHATSAPP",
      });
      localStorage.setItem(`orderAccessToken:${createdOrder.id}`, createdOrder.accessToken);
      const message = buildWhatsAppMessage({ customer, shipping: shippingInfo, cart, total });
      openWhatsApp({ phone: "573104173201", message });
      clearCart();
    } catch (error) {
      setPaymentError(error.message || "No fue posible reservar el inventario.");
    } finally {
      setLoading(false);
    }
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
          onWhatsApp: handleWhatsAppOrder,
        }}
      />
    </div>
  );
};

export default Checkout;
