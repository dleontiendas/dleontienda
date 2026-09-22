// src/components/PromoBar.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import "./PromoBar.css";

export default function PromoBar({
  name = "D'LEON GOLD STORE",
  address = "Dirección: Cra. 49 #48-31, Segovia, Antioquia, Colombia",
  sticky = true,
  theme = "brand",
  className = "",
  rightText = "Conócenos →",
  rightHref = "/nosotros",
  dismissible = true,
}) {
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);

  // El cierre dura solo esta visita; una recarga vuelve a mostrar la dirección.

  const handleClose = () => {
    setClosing(true); // dispara la animación de colapso vía CSS
  };

  const handleTransitionEnd = () => {
    if (!closing) return;
    setDismissed(true);
  };

  if (dismissed) return null;

  const barClasses = [
    "promo-bar",
    `promo-bar--${theme}`,
    sticky ? "promo-bar--sticky" : "",
    closing ? "promo-bar--closing" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="region"
      aria-label="Información de la tienda"
      className={barClasses}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="promo-bar__inner">
        <div className="promo-bar__text">
          <span className="promo-bar__msg">{name}</span>
          {address && <span className="promo-bar__address">{address}</span>}
        </div>

        <div className="promo-bar__actions">
          {rightHref && (
            <a href={rightHref} className="promo-bar__cta" aria-label="Conócenos">
              {rightText}
            </a>
          )}
          {dismissible && (
            <button
              type="button"
              className="promo-bar__close"
              onClick={handleClose}
              aria-label="Cerrar anuncio"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

PromoBar.propTypes = {
  name: PropTypes.string,
  address: PropTypes.string,
  sticky: PropTypes.bool,
  theme: PropTypes.oneOf(["brand", "dark", "light"]),
  className: PropTypes.string,
  rightText: PropTypes.string,
  rightHref: PropTypes.string,
  dismissible: PropTypes.bool,
};
