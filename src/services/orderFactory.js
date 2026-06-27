export function buildOrder({
  customer,
  cart,
  subtotal,
  shipping,
  total,
  paymentMethod,
  paymentProvider,
  wompiType,
  boldType,
}) {
  return {
    customer,

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
    paymentProvider,

    wompiType,
    boldType,

    status: "Initiated",
    paymentStatus: "PENDING",

    externalId: null,
    providerData: {},

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}