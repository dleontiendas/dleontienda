// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  const categorias = [
    {
      nombre: "Moda",
      imagen: "/img/moda.jpg",
      ruta: "/moda",
      descripcion: "Descubre las últimas tendencias en ropa y accesorios.",
    },
    {
      nombre: "Tecnología",
      imagen: "/img/tecnologia.jpg",
      ruta: "/tecnologia",
      descripcion: "Explora los gadgets y dispositivos más innovadores.",
    },
    {
      nombre: "Ofertas",
      imagen: "/img/ofertas.jpg",
      ruta: "/ofertas",
      descripcion: "Aprovecha descuentos exclusivos por tiempo limitado.",
    },
  ];

  return (
    <section className="container my-10">
      <h2 className="text-2xl font-semibold mb-6">Explora por Categorías</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <Link
            key={cat.nombre}
            to={cat.ruta}
            className="block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={cat.imagen}
              alt={cat.nombre}
              className="w-full h-56 object-cover"
            />
            <div className="p-4 bg-white">
              <h3 className="text-lg font-bold mb-2">{cat.nombre}</h3>
              <p className="text-gray-600 text-sm">{cat.descripcion}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
