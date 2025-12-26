// src/components/home/Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RandomProductsCarousel from "../product/carrousel/RandomProductsCarousel";
import "./Home.css";

export default function Home() {
  const categorias = [
    {
      nombre: "Moda",
      imagen: "/images/categories/moda.jpg",
      ruta: "/moda",
      descripcion: "Descubre las últimas tendencias en ropa y accesorios.",
    },
    {
      nombre: "Tecnología",
      imagen: "/images/categories/tecnologia.jpg",
      ruta: "/tecnologia",
      descripcion: "Explora los gadgets y dispositivos más innovadores.",
    },
   /* {
      nombre: "Ofertas",
      imagen: "/images/categories/ofertas.jpg",
      ruta: "/ofertas",
      descripcion: "Aprovecha descuentos exclusivos por tiempo limitado.",
    },*/
  ];

  const DESKTOP_SRCS = [
    "/images/hero/hero-desktop-1.png",
    "/images/hero/hero-desktop-2.jpg",
  ];

  const MOBILE_SRCS = [
    "/images/hero/hero-mobile-1.png",
    "/images/hero/hero-mobile-2.jpg",
  ];

  const [currentIdx, setCurrentIdx] = useState(0);

  const nextSlide = () =>
    setCurrentIdx((prev) => (prev + 1) % DESKTOP_SRCS.length);

  const prevSlide = () =>
    setCurrentIdx(
      (prev) => (prev - 1 + DESKTOP_SRCS.length) % DESKTOP_SRCS.length
    );

  useEffect(() => {
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
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
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/1920x600?text=Imagen+no+disponible";
                }}
              />
            </picture>
          ))}
        </div>

        <button className="nav-btn prev" onClick={prevSlide}>
          ‹
        </button>
        <button className="nav-btn next" onClick={nextSlide}>
          ›
        </button>

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

        <RandomProductsCarousel limit={10} />
      </div>
    </main>
  );
}
