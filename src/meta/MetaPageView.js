import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackMeta, newEventId } from "./pixel";
export default function MetaPageView() {
  const location = useLocation();
  const visit = useRef(null);
  useEffect(() => {
    if (visit.current?.key !== location.key) visit.current = { key: location.key, id: newEventId() };
    // Do not load Pixel on account, administration or order-result pages:
    // Pixel automatically reads document URL/referrer. No personal query values.
    if (/^\/(?:dashboard|login|register|checkout-success|checkout\/)/.test(location.pathname)) return;
    if (location.search && !/^\?variant=[A-Za-z0-9%_.!~*'()-]+$/.test(location.search)) return;
    trackMeta("PageView", {}, `page:${visit.current.id}`);
  }, [location]);
  return null;
}
