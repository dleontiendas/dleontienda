import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useCategoryHistoryState } from "./categoryHistory";
import CategoryPage from "./CategoryPage";
import Navbar from "../navbar/Navbar";
import ScrollToTop from "../ScrollToTop";
import { ProductsContext } from "../../context/ProductContext";
import { CartContext } from "../../context/CartContext";

jest.mock("../../context/ProductContext", () => ({ ProductsContext: require("react").createContext({}) }));
jest.mock("../../context/CartContext", () => ({ CartContext: require("react").createContext({}) }));

function Departments() {
  const [selected, select] = useCategoryHistoryState("selected", false);
  return <><button onClick={() => select(true)}>{selected ? "Departamento seleccionado" : "Todos los departamentos"}</button><Link to="/products/ropa/jeans">Ver jeans</Link></>;
}

function Product() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Atrás</button>;
}

function App({ loading = false }) {
  return <ProductsContext.Provider value={{ products: [], loading }}>
    <CartContext.Provider value={{ cart: [], subtotal: 0 }}>
      <MemoryRouter initialEntries={["/moda"]}>
        <ScrollToTop /><Navbar />
        <Routes>{["moda", "bolsos", "tecnologia", "hogar"].map(path =>
          <Route key={path} path={`/${path}`} element={<CategoryPage><Departments /></CategoryPage>} />
        )}<Route path="/products/ropa/jeans" element={<Product />} /></Routes>
      </MemoryRouter>
    </CartContext.Provider>
  </ProductsContext.Provider>;
}

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.clear();
  window.scrollTo = jest.fn();
});

test.each(["Moda", "Bolsos", "Tecnología", "Hogar"])("back from a product restores selection and scroll in %s, while a category click resets them", name => {
  render(<App />);
  fireEvent.click(screen.getByRole("link", { name }));
  act(() => { jest.advanceTimersByTime(20); });
  fireEvent.click(screen.getByText("Todos los departamentos"));
  Object.defineProperty(window, "scrollY", { configurable: true, value: 640 });
  fireEvent.click(screen.getByText("Ver jeans"));
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  window.scrollTo.mockClear();
  fireEvent.click(screen.getByText("Atrás"));
  act(() => { jest.advanceTimersByTime(20); });
  expect(screen.getByText("Departamento seleccionado")).toBeInTheDocument();
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 640, behavior: "instant" });
  fireEvent.click(screen.getByRole("link", { name }));
  expect(screen.getByText("Todos los departamentos")).toBeInTheDocument();
});
afterEach(() => { jest.useRealTimers(); });

test.each([false, true])("category links reset departments on repeat and category changes (mobile menu: %s)", mobile => {
  render(<App />);
  for (const name of ["Moda", "Bolsos", "Tecnología", "Hogar", "Moda"]) {
    for (let click = 0; click < 2; click++) {
      fireEvent.click(screen.getByText("Todos los departamentos"));
      if (mobile) fireEvent.click(screen.getByLabelText("Abrir menú de categorías"));
      window.scrollTo.mockClear();
      fireEvent.click(screen.getByRole("link", { name }));
      act(() => { jest.advanceTimersByTime(20); });
      expect(screen.getByText("Todos los departamentos")).toBeInTheDocument();
      expect(window.scrollTo).toHaveBeenCalledTimes(1);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: expect.any(Number), behavior: "smooth" });
      expect(document.body.style.overflow).toBe("");
    }
  }
});

test("waits for products before scrolling to departments", () => {
  const { rerender } = render(<App loading />);
  window.scrollTo.mockClear();
  fireEvent.click(screen.getByRole("link", { name: "Moda" }));
  act(() => { jest.advanceTimersByTime(20); });
  expect(window.scrollTo).not.toHaveBeenCalled();
  rerender(<App />);
  act(() => { jest.advanceTimersByTime(20); });
  expect(window.scrollTo).toHaveBeenCalledTimes(1);
});
