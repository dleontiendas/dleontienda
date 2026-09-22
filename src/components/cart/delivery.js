export const getDeliveryCost = (method, postalCode = "") => {
  if (method === "pickup") return 0;
  return String(postalCode).trim() === "052810" ? 10000 : 25000;
};

export const STORE_PICKUP_ADDRESS = {
  address: "D’LEON GOLD – Cra 49 #48-31",
  city: "Segovia",
  province: "Antioquia",
  reference: "RECOGER EN TIENDA — sin cobro de envío",
  deliveryMethod: "pickup",
};
