// src/pages/Home.jsx
import { Link } from "react-router-dom";
import "./Home.css"; // <-- Importa el CSS

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
    <section className="max-w-5xl mx-auto px-4 my-12">
      <h2 className="text-2xl font-semibold mb-8 text-center">
        Explora por Categorías
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <Link
            key={cat.nombre}
            to={cat.ruta}
            className="banner-card"
          >
            <div className="banner-img">
              <img src={cat.imagen} alt={cat.nombre} />
            </div>

            <div className="p-3">
              <h3 className="text-lg font-bold">{cat.nombre}</h3>
              <p className="text-gray-600 text-sm">{cat.descripcion}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
