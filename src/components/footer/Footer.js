import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#111",
        color: "#d4af37",
        paddingTop: "2rem",
        paddingBottom: "1rem",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        marginTop: "3rem",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "2rem",
          alignItems: "start",
          textAlign: "left",
        }}
      >
        {/* 🔹 Empresa */}
        <div>
          <h5
            style={{
              fontWeight: "700",
              color: "#fff",
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "1px",
            }}
          >
            DLEON <span style={{ color: "#d4af37" }}>Gold Store</span>
          </h5>
          <p
            style={{
              color: "#ccc",
              fontSize: "0.95rem",
              marginTop: "0.5rem",
              lineHeight: "1.6",
            }}
          >
            Joyas y accesorios exclusivos.  
            Tu lugar para encontrar elegancia y estilo.
          </p>
        </div>

        {/* 🔹 Enlaces */}
        <div>
          <h5
            style={{
              color: "#d4af37",
              fontWeight: "600",
              marginBottom: "0.8rem",
            }}
          >
            Enlaces
          </h5>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              { path: "/", name: "Inicio" },
              { path: "/products", name: "Productos" },
              { path: "/cart", name: "Carrito" },
              { path: "/checkout", name: "Checkout" },
              { path: "/login", name: "Iniciar sesión" },
              { path: "/register", name: "Registrarse" },
            ].map((link) => (
              <li key={link.path} style={{ marginBottom: "0.4rem" }}>
                <Link
                  to={link.path}
                  style={{
                    color: "#ccc",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.color = "#d4af37")}
                  onMouseOut={(e) => (e.target.style.color = "#ccc")}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 🔹 Redes sociales */}
        <div>
          <h5
            style={{
              color: "#d4af37",
              fontWeight: "600",
              marginBottom: "0.8rem",
            }}
          >
            Síguenos
          </h5>
          <div style={{ display: "flex", gap: "1rem" }}>
            <a href="#" style={{ color: "#d4af37" }}>
              <Instagram size={22} />
            </a>
            <a href="#" style={{ color: "#d4af37" }}>
              <Facebook size={22} />
            </a>
            <a href="#" style={{ color: "#d4af37" }}>
              <Twitter size={22} />
            </a>
          </div>
        </div>
      </div>

      {/* 🔹 Línea inferior */}
      <div
        style={{
          textAlign: "center",
          marginTop: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: "1rem",
          fontSize: "0.9rem",
          color: "#aaa",
        }}
      >
        © 2025 DLEON Gold Store — Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
