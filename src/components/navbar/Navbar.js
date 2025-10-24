import React, { useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { ProductsContext } from "../../context/ProductContext";
import { ShoppingCart, Bell, User, Menu, Search } from "lucide-react";
import "materialize-css/dist/css/materialize.min.css";
import "./Navbar.css";

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
    <header>
      {/*  Barra superior  */}
      <div className="navbar-top grey lighten-2 z-depth-1">
        <div className="container navbar-top-content">
          <div className="navbar-left">
            {/*<button className="btn-flat menu-btn">
              <Menu size={22} color="#000" />
              <span>Menú</span>
            </button>*/}
            <Link to="/" className="navbar-logo">
              <img
                src="/logodleon.png"
                alt="D'Leon Gold"
                className="brand-logo-img"
                style={{ height: "115px" }}
              />
            </Link>
          </div>

          {/*  Buscador */}
          <div className="navbar-search">
            <input
              type="search"
              placeholder="Buscar en D'Leon Gold..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="browser-default navbar-input"
            />
            <Search size={20} color="#555" className="navbar-search-icon" />
          </div>

          {/*  Acciones */}
          <div className="navbar-right">
            <Link
              to="/cart"
              className="nav-icon tooltipped"
              data-tooltip="Carrito"
            >
              <ShoppingCart size={24} color="#000" />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
              <span>Carrito</span>
            </Link>
          </div>
        </div>
      </div>

      {/*  Subbarra gris con categorías */}
      <div className="navbar-bottom grey lighten-3 z-depth-1">
        <div className="container navbar-bottom-content">
          <Link to="/inicio" className="nav-link active">
            Inicio
          </Link>
          <Link to="/" className="nav-link">
            Moda
          </Link>
          <Link to="/tecnologia" className="nav-link">
            Tecnología
          </Link>
          <Link to="/ofertas" className="nav-link">
            Ofertas
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
