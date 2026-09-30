import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProductsContext } from "../../context/ProductContext";
import BolsosProductList from "./bolsosProductList/bolsosProductList";
import TechProductList from "./techProductList/techProductList";
import HogarProductList from "./hogarProductList/HogarProductList";
import DamaProductList from "./damaProductList/damaProductList";
import HombreProductList from "./hombreProductList/hombreProductList";

const baseProduct = { price_cop: 100000, variants: [], images: [] };

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="search">{location.search}</output><button onClick={() => navigate(-1)}>Atrás</button><button onClick={() => navigate(1)}>Adelante</button></>;
}

function renderCategory(initialEntry, path, Component, products) {
  return render(
    <ProductsContext.Provider value={{ products, loading: false, error: null }}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <Routes><Route path={path} element={<Component />} /></Routes>
      </MemoryRouter>
    </ProductsContext.Provider>,
  );
}

test("Bolsos actualiza la URL y responde a Atrás y Adelante", () => {
  const products = [
    { ...baseProduct, id: "b1", catSlug: "bolsos", category: "Bolsos", department: "Mujer", subcategory: "MORRAL VIAJERO", name: "Bolso viajero" },
    { ...baseProduct, id: "b2", catSlug: "bolsos", category: "Bolsos", department: "Hombre", subcategory: "MORRAL EJECUTIVO", name: "Bolso ejecutivo" },
  ];
  renderCategory("/bolsos", "/bolsos", BolsosProductList, products);
  fireEvent.click(screen.getByRole("button", { name: /Mujer.*\(1\)/ }));
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer");
  fireEvent.click(screen.getByRole("button", { name: "MORRAL VIAJERO" }));
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer&categoria=morral&subcategoria=morral-viajero");
  expect(screen.getByText("Bolso viajero")).toBeInTheDocument();
  expect(screen.queryByText("Bolso ejecutivo")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
  expect(screen.getByTestId("search")).toHaveTextContent("?departamento=mujer");
  fireEvent.click(screen.getByRole("button", { name: "Adelante" }));
  expect(screen.getByTestId("search")).toHaveTextContent("subcategoria=morral-viajero");
});

test("Tecnología abre directamente un departamento y familia desde la URL", () => {
  const products = [
    { ...baseProduct, id: "t1", catSlug: "tecnologia", category: "Tecnología", department: "Otros", subcategory: "AUDIFONOS BLUETOOTH", name: "Audífonos Bluetooth" },
    { ...baseProduct, id: "t2", catSlug: "tecnologia", category: "Tecnología", department: "Otros", subcategory: "CARGADORES", name: "Cargador rápido" },
  ];
  renderCategory("/tecnologia?departamento=otros&categoria=audifonos", "/tecnologia", TechProductList, products);
  expect(screen.getByText("Audífonos Bluetooth")).toBeInTheDocument();
  expect(screen.queryByText("Cargador rápido")).not.toBeInTheDocument();
});

test("Hogar abre directamente una sección y subcategoría desde la URL", () => {
  const products = [
    { ...baseProduct, id: "h1", catSlug: "hogar", category: "Hogar", department: "Descanso", subcategory: "HAMACAS", name: "Hamaca familiar" },
    { ...baseProduct, id: "h2", catSlug: "hogar", category: "Hogar", department: "Baño", subcategory: "TOALLAS", name: "Toalla de baño" },
  ];
  renderCategory("/hogar?departamento=descanso&categoria=hamacas", "/hogar", HogarProductList, products);
  expect(screen.getByText("Hamaca familiar")).toBeInTheDocument();
  expect(screen.queryByText("Toalla de baño")).not.toBeInTheDocument();
});

test("Hombre filtra departamentos y no mezcla Dama ni Moda", () => {
  const products = [
    { ...baseProduct, id: "h1", catSlug: "hombre", category: "Hombre", department: "Jeans", subcategory: "PANTALON CARGO", name: "Pantalón cargo hombre" },
    { ...baseProduct, id: "h2", catSlug: "hombre", category: "Hombre", department: "Ropa deportiva", subcategory: "CAPRI", name: "Capri hombre" },
    { ...baseProduct, id: "d1", catSlug: "dama", category: "Dama", department: "Jeans", subcategory: "SKINNY", name: "Jean dama" },
  ];
  renderCategory("/hombre?departamento=ropa-deportiva&categoria=capri", "/hombre", HombreProductList, products);
  expect(screen.getByText("Capri hombre")).toBeInTheDocument();
  expect(screen.queryByText("Pantalón cargo hombre")).not.toBeInTheDocument();
  expect(screen.queryByText("Jean dama")).not.toBeInTheDocument();
});

test("Dama filtra departamento y subcategoría desde la URL sin mezclar Moda", () => {
  const products = [
    { ...baseProduct, id: "d1", catSlug: "dama", category: "Dama", department: "Jeans", subcategory: "SKINNY", name: "Jean skinny dama" },
    { ...baseProduct, id: "d2", catSlug: "dama", category: "Dama", department: "Accesorios", subcategory: "CINTURONES", name: "Cinturón dama" },
    { ...baseProduct, id: "m1", catSlug: "ropa", category: "ROPA", department: "HOMBRE", subcategory: "JEANS", name: "Jean hombre" },
  ];
  renderCategory("/dama?departamento=jeans&categoria=skinny", "/dama", DamaProductList, products);
  expect(screen.getByText("Jean skinny dama")).toBeInTheDocument();
  expect(screen.queryByText("Cinturón dama")).not.toBeInTheDocument();
  expect(screen.queryByText("Jean hombre")).not.toBeInTheDocument();
});
