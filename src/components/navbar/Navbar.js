import React, { useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { ProductsContext } from "../../context/ProductContext";
import { ShoppingCart, Search } from "lucide-react";

const Navbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { cart } = useContext(CartContext);
  const { products } = useContext(ProductsContext);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products.filter((p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  return (
    <nav
      style={{
        backgroundColor: "#fff",
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.6rem 1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* 🔸 Brand / Logo */}
        <Link
          to="/"
          style={{
            fontWeight: "800",
            fontSize: "2.5rem",
            color: "#d4af37",
            textDecoration: "none",
            fontFamily: "'Playfair Display', serif",
            letterSpacing: "1px",
          }}
        >
          D'LEON GOLD<span style={{ color: "#000" }}>  Store</span>
        </Link>

        {/* 🔍 Search Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "0.4rem 0.8rem",
            flex: "1 1 300px",
            maxWidth: "350px",
            maxHeight: "40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
              fontSize: "1.5rem",
              background: "transparent",
              color: "#333",
            }}
          />
          <Search size={20} color="#d4af37" style={{ cursor: "pointer" }} />
        </div>

        {/* 🛒 Cart Icon */}
        <Link
          to="/cart"
          style={{
            position: "relative",
            color: "#444",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShoppingCart size={26} color="#d4af37" />
          {totalItems > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-6px",
                background: "#ff5722",
                color: "#fff",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: "bold",
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
