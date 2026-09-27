import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { getDoc } from "firebase/firestore";
import ProductDetail from "./ProductDetail";
import { CartContext } from "../../context/CartContext";
jest.mock("../../Firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({ doc: jest.fn(), getDoc: jest.fn(), collectionGroup: jest.fn(), getDocs: jest.fn(), query: jest.fn(), where: jest.fn() }));
jest.mock("./carrousel/RandomProductsCarousel", () => () => null);
const product = { sku: "JEAN", name: "Jean de prueba", price_cop: 100000, images: ["https://dleongold.com/jean.jpg"], variants: [{ color: "AZUL", tallas: [{ size: "10", stock: 1, sku_master: "REG" }, { size: "42", stock: 2, price_cop: 130000, sku_master: "PLUS" }] }] };
const addToCart = jest.fn();
beforeEach(() => { window.scrollTo = jest.fn(); addToCart.mockClear(); getDoc.mockResolvedValue({ exists: () => true, id: "JEAN", data: () => product }); });
function open(id) {
  return render(<HelmetProvider><CartContext.Provider value={{ addToCart }}><MemoryRouter initialEntries={[`/products/ropa/JEAN?variant=${encodeURIComponent(id)}`]}><Routes><Route path="/products/:category/:productId" element={<ProductDetail />} /></Routes></MemoryRouter></CartContext.Provider></HelmetProvider>);
}
test("catalog link selects plus size and its price before adding to cart", async () => {
  open("v:PLUS");
  expect(await screen.findByRole("button", { name: "42" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByText("$130.000").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: /añadir al carrito/i }));
  expect(addToCart).toHaveBeenCalledWith(expect.objectContaining({ id: "JEAN" }), 1, "42", "AZUL");
});
test("unknown catalog variant does not silently show another price", async () => {
  open("v:UNKNOWN"); expect(await screen.findByText(/Esta variante no está disponible/)).toBeInTheDocument();
  expect(addToCart).not.toHaveBeenCalled();
});
