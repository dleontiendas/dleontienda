// src/components/home/Home.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

/* Helpers Drive */
const parseDriveId = (s="") =>
  (String(s).match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]) ||
  (String(s).match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1]) ||
  String(s);
const driveView  = (id) => `https://drive.google.com/uc?export=view&id=${parseDriveId(id)}`;
const driveThumb = (id, w=1920) => `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(id)}`;
const driveLH3   = (id, w=1920) => `https://lh3.googleusercontent.com/d/${parseDriveId(id)}=w${w}`;

const HERO_ID = "1Gbhzt5qPIeJLlHnnOAHEPCbCXRq5WFLu";

export default function Home() {
  const categorias = [
    { nombre: "Moda", imagen: "https://static.vecteezy.com/system/resources/previews/005/096/535/non_2x/fashion-clothing-neon-banner-design-vector.jpg", ruta: "/moda", descripcion: "Descubre las últimas tendencias en ropa y accesorios." },
    { nombre: "Tecnología", imagen: "https://puntopc.com.co/wp-content/uploads/2025/04/Banner-Tecnologia-Punto-PC.webp", ruta: "/tecnologia", descripcion: "Explora los gadgets y dispositivos más innovadores." },
    { nombre: "Ofertas", imagen: "https://marketplace.canva.com/EAFD3LQExj0/1/0/1600w/canva-banner-anuncio-rebajas-de-verano-ofertas-tienda-online-negro-rosa-BlReD-pFXpQ.jpg", ruta: "/ofertas", descripcion: "Aprovecha descuentos exclusivos por tiempo limitado." },
  ];

  // Cadenas de fallback (mismo índice para desktop y mobile)
  const DESKTOP_SRCS = [
    driveView(HERO_ID),
    driveThumb(HERO_ID, 1920),
    driveLH3(HERO_ID, 1920),
    "/assets/dleon_hero_light_1920x560.png", // local
  ];
  const MOBILE_SRCS = [
    driveView(HERO_ID),
    driveThumb(HERO_ID, 1080),
    driveLH3(HERO_ID, 1080),
    "/assets/dleon_hero_light_1080x720.png",
  ];

  const [heroIdx, setHeroIdx] = useState(0);
  const onHeroError = () =>
    setHeroIdx((i) => (i < DESKTOP_SRCS.length - 1 ? i + 1 : i));

  return (
    <main className="page">
      {/* Hero full-width */}
      <section className="hero-wrap">
        <picture>
          <source media="(max-width: 640px)" srcSet={MOBILE_SRCS[heroIdx]} />
          <img
            className="hero-img"
            src={DESKTOP_SRCS[heroIdx]}
            alt="D'LEON GOLD — Moda urbana y tecnología"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={onHeroError}
            onLoad={() => console.log("✅ Hero cargado:", DESKTOP_SRCS[heroIdx])}
          />
        </picture>
      </section>

      {/* Contenido */}
      <div className="site-container">
        <h2 className="page-title center-align">Explora por Categorías</h2>
        <div className="banner-grid">
          {categorias.map((cat) => (
            <Link key={cat.nombre} to={cat.ruta} className="banner-card">
              <div className="banner-img">
                <img
                  src={cat.imagen}
                  alt={cat.nombre}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.warn("⚠️ Error categoría:", cat.nombre);
                    e.currentTarget.src =
                      "https://placehold.co/800x400?text=Imagen+no+disponible";
                  }}
                />
              </div>
              <div className="banner-body">
                <h3 className="banner-title">{cat.nombre}</h3>
                <p className="banner-desc">{cat.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
