// src/components/PromoBar.jsx
import React from "react";
import PropTypes from "prop-types";

const THEMES = {
  brand: { bg: "#111827", fg: "#ffffff", border: "transparent", ctaBg: "#ffffff", ctaFg: "#111827" },
  dark:  { bg: "#000000", fg: "#ffffff", border: "transparent", ctaBg: "#ffffff", ctaFg: "#111827" },
  light: { bg: "#f7f7f7", fg: "#111111", border: "#e5e5e5", ctaBg: "#111111", ctaFg: "#ffffff" },
};

const styles = {
  bar: (t, sticky) => ({
    position: sticky ? "sticky" : "static",
    top: 0,
    zIndex: 1000,
    width: "100%",
    boxSizing: "border-box",
    background: t.bg,
    color: t.fg,
    borderBottom: t.border === "transparent" ? undefined : `1px solid ${t.border}`,
  }),
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "10px 16px",
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  left: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  name: { fontWeight: 700, fontSize: "0.98rem" },
  address: {
    opacity: 0.9,
    fontSize: "0.92rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "80vw",
  },
  right: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  cta: (t) => ({
    padding: "6px 12px",
    borderRadius: 999,
    textDecoration: "none",
    display: "inline-block",
    border: `1px solid ${t.ctaBg}`,
    background: t.ctaBg,
    color: t.ctaFg,
    fontWeight: 600,
    whiteSpace: "nowrap",
    userSelect: "none",
  }),
};

export default function PromoBar({
  name,
  address,
  sticky = true,
  theme = "brand",
  className = "",
  rightText = "Conócenos →",
  rightHref = "/nosotros",
}) {
  const t = THEMES[theme] || THEMES.brand;

  return (
    <div role="region" aria-label="Información de la tienda" className={className} style={styles.bar(t, sticky)}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <span style={styles.name}>D’LEON GOLD</span>
          <span style={styles.address}>Dirección: Cra. 49 #48-31, Segovia, Antioquia, Colombia </span>
        </div>

        <div style={styles.right}>
          {rightHref ? (
            <a href={rightHref} style={styles.cta(t)} aria-label="Conócenos">
              {rightText}
            </a>
          ) : (
            <span style={{ opacity: 0.95 }}>{rightText}</span>
          )}
        </div>
      </div>
    </div>
  );
}

PromoBar.propTypes = {
  name: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  sticky: PropTypes.bool,
  theme: PropTypes.oneOf(["brand", "dark", "light"]),
  className: PropTypes.string,
  rightText: PropTypes.string,
  rightHref: PropTypes.string,
};
