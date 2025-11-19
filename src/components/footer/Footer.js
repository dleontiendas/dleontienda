import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#ffffffff",
        color: "#000000ff",
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
        {/* Empresa */}
        <div>
          <h5
            style={{
              fontWeight: "700",
              color: "#0f0f0fff",
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "1px",
            }}
          >
            D'LEON GOLD
          </h5>

          <p
            style={{
              color: "#2e2d2bff",
              fontSize: "0.95rem",
              marginTop: "0.5rem",
              lineHeight: "1.6",
            }}
          >
            Tienda de Ropa y Accesorios especializada en ofrecer las Mejores
            Marcas en todos sus productos y servicios. Ropa para Damas,
            Caballeros, Niños y Toda una Miscelánea de Productos para el hogar
            y uso cotidiano de todas las personas.
          </p>
        </div>

        {/* Información legal */}
        <div>
          <h5 className="font-semibold mb-3">Información legal</h5>
          <ul className="space-y-1 text-sm text-gray-300">
            <li><Link to="/terminos">Términos y condiciones</Link></li>
            <li><Link to="/privacidad">Política de privacidad</Link></li>
            <li><Link to="/garantias">Política de garantías</Link></li>
            <li><Link to="/envios">Política de envíos</Link></li>
            <li><Link to="/cookies">Política de cookies</Link></li>
            <li><Link to="/aviso-legal">Aviso legal</Link></li>
          </ul>
        </div>

        {/* Redes sociales */}
        <div>
          <h5
            style={{
              color: "#131212ff",
              fontWeight: "600",
              marginBottom: "0.8rem",
            }}
          >
            Síguenos
          </h5>

          <div style={{ display: "flex", gap: "1rem" }}>
            <a href="https://www.instagram.com/tiendadleon/" style={{ color: "#d4af37" }}>
              <Instagram size={25} />
            </a>
            <a href="https://www.facebook.com/dleongold?mibextid=ZbWKwL" style={{ color: "#d4af37" }}>
              <Facebook size={25} />
            </a>
            <a href="https://www.tiktok.com/@dleongold" style={{ color: "#d4af37" }}>
              <FaTiktok size={25} />
            </a>
            <a href="https://chat.whatsapp.com/HjivrzlnGBY3Jwe5QQz5BZ" style={{ color: "#d4af37" }}>
              <FaWhatsapp size={25} />
            </a>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div
        style={{
          textAlign: "center",
          marginTop: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: "1rem",
          fontSize: "0.9rem",
          color: "#777777ff",
        }}
      >
        © 2025 DLEON Gold Store — Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
