import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { ProductsContext } from "../../context/ProductContext";

const Navbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { cart } = useContext(CartContext);
  const { products, loading } = useContext(ProductsContext);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const filteredProducts =
    searchTerm.trim().length > 0
      ? products.filter((p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #eee",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "150px 1fr 80px", // Logo | Buscador | Carrito
          alignItems: "center", // 👈 centra verticalmente todo
          padding: "0.3rem 1.5rem", // 👈 menos padding para que la navbar sea más baja
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontWeight: "bold",
            fontSize: "2.4rem",
            color: "#0e0d0dff",
            textDecoration: "none",
            letterSpacing: "0.5px",
            lineHeight: "1", // 👈 evita que el texto se vea desfasado
          }}
        >
          D'LEON GOLD
        </Link>

        {/* Search Bar */}
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#f9f9f9",
              border: "1px solid #ddd",
              borderRadius: "10px", // 👈 menos redondeado
              padding: "0.5rem 0.90rem", // 👈 más compacto
              height: "40px", // 👈 altura fija más pequeña
            }}
          >
            <input
              type="search"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: "1.5rem", // 👈 texto un poco más chico
                background: "transparent",
                color: "#333",
              }}
            />
            <i
              className="material-icons"
              style={{ color: "#ff6f00", cursor: "pointer", fontSize: "20px" }}
            >
              search
            </i>
          </div>
        </div>

        {/* Cart */}
        <Link
          to="/cart"
          style={{
            position: "relative",
            color: "#444",
            textDecoration: "none",
            justifySelf: "end",
          }}
        >
          <i
            className="material-icons"
            style={{ fontSize: "1.6rem", color: "#ff6f00" }}
          >
            shopping_cart
          </i>
          {totalItems > 0 && (
            <span
              style={{
                position: "absolute",
                top: "30px", // 👈 súbelo un poquito
                right: "-6px", // 👈 pégalo más al ícono
                background: "#ff5722",
                color: "#fff",
                borderRadius: "50%", // 👈 círculo perfecto
                width: "18px", // 👈 tamaño fijo más pequeño
                height: "18px",
                display: "flex", // 👈 para centrar el número
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem", // 👈 texto más chico
                fontWeight: "bold",
                lineHeight: "1",
              }}
            >
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
