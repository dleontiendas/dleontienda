export function buildWhatsAppMessage({
  customer,
  shipping,
  cart,
  total,
}) {
  return encodeURIComponent(
    `Nuevo pedido\n\n` +
      `${customer.first_name} ${customer.last_name}\n` +
      `${customer.email}\n` +
      `${customer.phone}\n\n` +
      `Entrega a:\n` +
      `${shipping.first_name} ${shipping.last_name}\n` +
      `${shipping.phone}\n` +
      `${shipping.address}, ${shipping.city}\n\n` +
      cart
        .map(
          (item) =>
            `• ${item.name} x${item.quantity} - $${Number(
              item.price_cop
            ).toLocaleString("es-CO")}`
        )
        .join("\n") +
      `\n\nTotal: $${total.toLocaleString("es-CO")}`
  );
}

export function openWhatsApp({
  phone,
  message,
}) {
  window.open(
    `https://wa.me/${phone}?text=${message}`,
    "_blank"
  );
}