import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCookieConsent } from "./ConsentContext";
import "./CookieConsent.css";

export default function CookieConsent() {
  const consent = useCookieConsent();
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (consent.preferencesOpen) setMarketing(consent.marketing);
  }, [consent.preferencesOpen, consent.marketing]);

  useEffect(() => {
    if (!consent.preferencesOpen) return undefined;
    const closeOnEscape = event => { if (event.key === "Escape") consent.closePreferences(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [consent]);

  return <>
    {!consent.decided && !consent.preferencesOpen && (
      <section className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title">
        <div className="cookie-banner-copy">
          <h2 id="cookie-banner-title">Tu privacidad y tus cookies</h2>
          <p>
            Usamos almacenamiento necesario para que funcionen el carrito, el inicio de sesión y los pedidos.
            Con tu permiso, Meta Pixel y Conversions API medirán visitas y compras para mejorar nuestros anuncios.
            Puedes aceptar, rechazar o cambiar tu elección cuando quieras.
          </p>
          <Link to="/cookies">Leer la política de cookies</Link>
        </div>
        <div className="cookie-banner-actions">
          <button type="button" className="cookie-button secondary" onClick={consent.rejectMarketing}>Rechazar marketing</button>
          <button type="button" className="cookie-button secondary" onClick={consent.openPreferences}>Personalizar</button>
          <button type="button" className="cookie-button primary" onClick={consent.acceptMarketing}>Aceptar marketing</button>
        </div>
      </section>
    )}

    {consent.preferencesOpen && (
      <div className="cookie-modal-backdrop" role="presentation">
        <section className="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
          <button type="button" className="cookie-modal-close" aria-label="Cerrar preferencias" onClick={consent.closePreferences}>×</button>
          <h2 id="cookie-preferences-title">Preferencias de cookies</h2>
          <div className="cookie-category">
            <div>
              <strong>Necesarias</strong>
              <p>Conservan el carrito, la sesión, la entrega elegida y el acceso seguro a tus pedidos.</p>
            </div>
            <span className="cookie-required">Siempre activas</span>
          </div>
          <label className="cookie-category cookie-choice">
            <div>
              <strong>Marketing de Meta</strong>
              <p>Permite medir navegación, productos vistos, carrito, checkout y compras confirmadas mediante Pixel y CAPI.</p>
            </div>
            <input type="checkbox" checked={marketing} onChange={event => setMarketing(event.target.checked)} />
          </label>
          <p className="cookie-modal-note">No necesitas aceptar marketing para comprar. Consulta nuestra <Link to="/privacidad" onClick={consent.closePreferences}>política de privacidad</Link>.</p>
          <div className="cookie-modal-actions">
            <button type="button" className="cookie-button secondary" onClick={() => consent.savePreferences(false)}>Rechazar marketing</button>
            <button type="button" className="cookie-button primary" onClick={() => consent.savePreferences(marketing)}>Guardar preferencias</button>
          </div>
        </section>
      </div>
    )}
  </>;
}
