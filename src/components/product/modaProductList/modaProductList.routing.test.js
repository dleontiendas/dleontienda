import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProductsContext } from "../../../context/ProductContext";
import ModaProductList from "./modaProductList";

const products = [
  { id: "1", catSlug: "ropa", name: "Jean básico", department: "Mujer", category: "ROPA", subcategory: "JEANS", price_cop: 100000, variants: [] },
  { id: "2", catSlug: "ropa", name: "Jean destroyer", department: "Mujer", category: "ROPA", subcategory: "JEANS SKINNY DESTROYER", price_cop: 120000, variants: [] },
  { id: "3", catSlug: "ropa", name: "Camiseta mujer", department: "Mujer", category: "ROPA", subcategory: "CAMISETAS", price_cop: 60000, variants: [] },
  { id: "4", catSlug: "ropa", name: "Jean hombre", department: "Hombre", category: "ROPA", subcategory: "JEANS", price_cop: 110000, variants: [] },
];

function LocationAndHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="search">{location.search}</output><button onClick={() => navigate(-1)}>Atrás</button><button onClick={() => navigate(1)}>Adelante</button></>;
}

function renderModa(initialEntry = "/moda") {
  return render(
    <ProductsContext.Provider value={{ products, loading: false, error: null }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/moda" element={<><LocationAndHistory /><ModaProductList /></>} />
        </Routes>
      </MemoryRouter>
    </ProductsContext.Provider>
  );
}

test.each([
  ["/moda", ["Jean básico", "Jean destroyer", "Camiseta mujer", "Jean hombre"]],
  ["/moda?departamento=mujer", ["Jean básico", "Jean destroyer", "Camiseta mujer"]],
  ["/moda?departamento=mujer&categoria=jeans", ["Jean básico", "Jean destroyer"]],
  ["/moda?departamento=mujer&categoria=jeans&subcategoria=jeans-skinny-destroyer", ["Jean destroyer"]],
])("loads filters directly from %s", (url, visibleNames) => {
  renderModa(url);
  for (const name of visibleNames) expect(screen.getByText(name)).toBeInTheDocument();
  for (const name of products.map(({ name }) => name).filter((name) => !visibleNames.includes(name))) {
    expect(screen.queryByText(name)).not.toBeInTheDocument();
  }
});

test("filter changes create SPA history entries that support Back and Forward", () => {
  renderModa();
  const mujerDepartment = screen.getAllByRole("button", { name: /^Mujer/ })
    .find((button) => button.classList.contains("gender-chip"));
  fireEvent.click(mujerDepartment);
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer");

  fireEvent.click(screen.getByRole("button", { name: "JEANS SKINNY DESTROYER" }));
  expect(screen.getByTestId("search")).toHaveTextContent(
    "?departamento=mujer&categoria=jeans&subcategoria=jeans-skinny-destroyer"
  );
  expect(screen.getByText("Jean destroyer")).toBeInTheDocument();
  expect(screen.queryByText("Jean básico")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer");
  expect(screen.getByText("Camiseta mujer")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Adelante" }));
  expect(screen.getByTestId("search")).toHaveTextContent("subcategoria=jeans-skinny-destroyer");
  expect(screen.getByText("Jean destroyer")).toBeInTheDocument();
});

test("changing and repeating an active category updates or clears its URL filters", () => {
  renderModa("/moda?departamento=mujer&categoria=jeans");
  fireEvent.click(screen.getByRole("button", { name: "CAMISETAS" }));
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer&categoria=camisetas");
  expect(screen.getByText("Camiseta mujer")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "CAMISETAS" }));
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer");
  expect(screen.getByText("Jean básico")).toBeInTheDocument();
});
