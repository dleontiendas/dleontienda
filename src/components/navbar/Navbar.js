import React, { useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { ProductsContext } from "../../context/ProductContext";
import { ShoppingCart, Search } from "lucide-react";
import "./Navbar.css"; // 🔹 Importar estilos separados

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
    <nav className="navbar">
      <div className="navbar-container">
        {/* 🔸 Brand / Logo */}
        <Link to="/" className="navbar-logo">
          D'LEON GOLD<span className="navbar-store"> Store</span>
        </Link>

        {/* 🔍 Search Bar */}
        <div className="navbar-search">
          <input
            type="search"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="navbar-input"
          />
          <Search size={20} color="#d4af37" className="navbar-search-icon" />
        </div>

        {/* 🛒 Cart Icon */}
        <Link to="/cart" className="navbar-cart">
          <ShoppingCart size={26} color="#d4af37" />
          {totalItems > 0 && <span className="navbar-cart-badge">{totalItems}</span>}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
