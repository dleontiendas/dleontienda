// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// why: React Router no resetea el scroll al navegar (a diferencia de
// una navegación tradicional de páginas). Este componente vive dentro
// del Router y sube la ventana al top cada vez que cambia la ruta.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
