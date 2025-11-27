// src/components/home/Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";


/* Helpers Drive */
const parseDriveId = (s = "") =>
  String(s).match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
  String(s).match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ||
  String(s);

const driveView = (id) =>
  `https://drive.google.com/uc?export=view&id=${parseDriveId(id)}`;

const driveThumb = (id, w = 1920) =>
  `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${parseDriveId(id)}`;

const driveLH3 = (id, w = 1920) =>
  `https://lh3.googleusercontent.com/d/${parseDriveId(id)}=w${w}`;

const HERO_ID = "1Gbhzt5qPIeJLlHnnOAHEPCbCXRq5WFLu";

export default function Home() {
  const categorias = [
    {
      nombre: "Moda",
      imagen:
        "https://static.vecteezy.com/system/resources/previews/005/096/535/non_2x/fashion-clothing-neon-banner-design-vector.jpg",
      ruta: "/moda",
      descripcion: "Descubre las últimas tendencias en ropa y accesorios.",
    },
    {
      nombre: "Tecnología",
      imagen:
        "https://puntopc.com.co/wp-content/uploads/2025/04/Banner-Tecnologia-Punto-PC.webp",
      ruta: "/tecnologia",
      descripcion: "Explora los gadgets y dispositivos más innovadores.",
    },
    {
      nombre: "Ofertas",
      imagen:
        "https://marketplace.canva.com/EAFD3LQExj0/1/0/1600w/canva-banner-anuncio-rebajas-de-verano-ofertas-tienda-online-negro-rosa-BlReD-pFXpQ.jpg",
      ruta: "/ofertas",
      descripcion: "Aprovecha descuentos exclusivos por tiempo limitado.",
    },
  ];

  const DESKTOP_SRCS = [
    driveThumb(
      "https://drive.google.com/file/d/1Gbhzt5qPIeJLlHnnOAHEPCbCXRq5WFLu/view?usp=drive_link",
      1920
    ),
    driveLH3(
      "https://drive.google.com/file/d/1Gbhzt5qPIeJLlHnnOAHEPCbCXRq5WFLu/view?usp=drive_link",
      1920
    ),
  ];

  const MOBILE_SRCS = [driveThumb(HERO_ID, 1080), driveLH3(HERO_ID, 1080)];

  const [heroIdx, setHeroIdx] = useState(0);
  const onHeroError = () =>
    setHeroIdx((i) => (i < DESKTOP_SRCS.length - 1 ? i + 1 : i));

  const [currentIdx, setCurrentIdx] = useState(0);
  const nextSlide = () =>
    setCurrentIdx((prev) => (prev + 1) % DESKTOP_SRCS.length);
  const prevSlide = () =>
    setCurrentIdx((prev) => (prev - 1 + DESKTOP_SRCS.length) % DESKTOP_SRCS.length);

  useEffect(() => {
    const t = setInterval(() => nextSlide(), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="page">    
      {/* ===== HERO CAROUSEL ===== */}
      <section className="hero-carousel">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {DESKTOP_SRCS.map((src, i) => (
            <picture key={i} className="carousel-slide">
              <source media="(max-width: 640px)" srcSet={MOBILE_SRCS[i]} />
              <img
                className="hero-img"
                src={src}
                alt={`Slide ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                onError={onHeroError}
              />
            </picture>
          ))}
        </div>

        <button className="nav-btn prev" onClick={prevSlide}>‹</button>
        <button className="nav-btn next" onClick={nextSlide}>›</button>

        <div className="carousel-dots">
          {DESKTOP_SRCS.map((_, i) => (
            <button
              key={i}
              className={`dot ${currentIdx === i ? "active" : ""}`}
              onClick={() => setCurrentIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* ===== CONTENIDO ===== */}
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