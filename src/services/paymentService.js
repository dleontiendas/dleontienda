import {
  createWompiPayment,
  createAddiPayment,
  createBoldPayment,
  createSistecreditoPayment,
} from "../api/paymentsApi";

export async function startPayment(
  provider,
  payload = {}
) {
  switch (provider?.toUpperCase()) {
    case "WOMPI":
      return createWompiPayment(payload);

    case "ADDI":
      return createAddiPayment(payload);

    case "BOLD":
      return createBoldPayment(payload);

    case "SISTECREDITO":
      return createSistecreditoPayment(payload);

    default:
      throw new Error(
        `Proveedor no soportado: ${provider}`
      );
  }
}