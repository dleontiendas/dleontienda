import React, { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { ProductsContext } from "../../context/ProductContext";
import { readCategoryHistory, saveCategoryHistory } from "./categoryHistory";

// A new router entry also resets filters when the active category is clicked.
export default function CategoryPage({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { loading, error } = useContext(ProductsContext);
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    return () => saveCategoryHistory(location, "scroll", window.scrollY);
  }, [location]);

  useEffect(() => {
    if (loading || error) return;
    const savedScroll = navigationType === "POP" ? readCategoryHistory(location, "scroll", null) : null;
    if (savedScroll === null && !location.state?.showDepartments) return;
    const frame = requestAnimationFrame(() => {
      if (savedScroll !== null) {
        window.scrollTo({ top: savedScroll, behavior: "instant" });
        return;
      }
      const section = sectionRef.current;
      if (!section) return;
      const navbar = document.querySelector(".site-navbar");
      const navbarHeight = navbar?.getBoundingClientRect().height || 0;
      const top = section.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location, navigationType, loading, error]);

  return <div ref={sectionRef}>{React.cloneElement(children, { key: location.key })}</div>;
}
