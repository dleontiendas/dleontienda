import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const storageKey = (location, field) => `category:${location.pathname}:${location.key}:${field}`;

export function readCategoryHistory(location, field, fallback) {
  try {
    const saved = sessionStorage.getItem(storageKey(location, field));
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

export function saveCategoryHistory(location, field, value) {
  try {
    sessionStorage.setItem(storageKey(location, field), JSON.stringify(value));
  } catch {
    // Browsing remains usable when session storage is unavailable.
  }
}

// Each history entry owns its filters; a fresh category click starts empty.
export function useCategoryHistoryState(field, initialValue) {
  const location = useLocation();
  const [value, setValue] = useState(() => readCategoryHistory(location, field, initialValue));
  useEffect(() => {
    saveCategoryHistory(location, field, value);
  }, [location, field, value]);
  return [value, setValue];
}
