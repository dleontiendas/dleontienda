// src/components/home/Home.js  (puede llamarse .jsx si prefieres)
import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

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

  return (
    <main className="page">
      <div className="site-container">
        <h2 className="page-title center-align">Explora por Categorías</h2>

        <div className="banner-grid">
          {categorias.map((cat) => (
            <Link key={cat.nombre} to={cat.ruta} className="banner-card">
              <div className="banner-img">
                <img
                  src={cat.imagen}
                  alt={cat.nombre}
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
