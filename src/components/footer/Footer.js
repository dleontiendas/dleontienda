// src/components/footer/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import "./Footer.css"; // estilos externos

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="footer-container">
        {/* Marca */}
        <div>
          <h5 className="footer-brand">D’LEON GOLD</h5>
          <p className="footer-text">
            Moda urbana y tecnología. Marcas seleccionadas para damas,
            caballeros e infantil. También accesorios y básicos del día a día.
          </p>

          <a
            className="footer-cta"
            href="https://wa.me/573104173201?text=Hola%20D%E2%80%99LEON%20GOLD%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
          >
            <FaWhatsapp size={18} />
            <span>Chatea con un asesor</span>
          </a>
        </div>

        {/* Explorar */}
        <div>
          <h6 className="footer-heading">Explorar</h6>
          <ul className="footer-list">
            <li>
              <Link to="/moda" className="footer-link">
                Moda
              </Link>
            </li>
            <li>
              <Link to="/tecnologia" className="footer-link">
                Tecnología
              </Link>
            </li>
            <li>
              <Link to="/ofertas" className="footer-link">
                Ofertas
              </Link>
            </li>
            <li>
              <Link to="/products" className="footer-link">
                Todos los productos
              </Link>
            </li>
          </ul>
        </div>

        {/* Legales */}
        <div>
          <h6 className="footer-heading">Legales</h6>
          <ul className="footer-list">
            <li>
              <Link to="/terminos" className="footer-link">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link to="/privacidad" className="footer-link">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link to="/garantias" className="footer-link">
                Garantías
              </Link>
            </li>
            <li>
              <Link to="/envios" className="footer-link">
                Envíos y devoluciones
              </Link>
            </li>
            <li>
              <Link to="/cookies" className="footer-link">
                Cookies
              </Link>
            </li>
            <li>
              <Link to="/aviso-legal" className="footer-link">
                Aviso legal
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h6 className="footer-heading">Contacto</h6>
          <ul className="footer-list">
            <li>
              <span className="footer-muted">Email:</span> dleongold@dleongold.com
            </li>
            <li>
              <span className="footer-muted">Tel:</span> +57 310 417 3201
            </li>
            <li>
              <span className="footer-muted">Horario:</span> Lunes a Domingo 8:00 AM – 9:00 PM
            </li>
            <li>
              <span className="footer-muted">Dirección:</span> Cra. 49 #48-31, Segovia, Antioquia, Colombia
            </li>
          </ul>

          <div className="footer-social">
            <a
              className="footer-social-btn"
              href="https://www.instagram.com/tiendadleon/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram size={22} />
            </a>
            <a
              className="footer-social-btn"
              href="https://www.facebook.com/dleongold?mibextid=ZbWKwL"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook size={22} />
            </a>
            <a
              className="footer-social-btn"
              href="https://www.tiktok.com/@dleongold"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTiktok size={20} />
            </a>
            <a
              className="footer-social-btn"
              href="https://chat.whatsapp.com/HjivrzlnGBY3Jwe5QQz5BZ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} D’LEON GOLD — Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
