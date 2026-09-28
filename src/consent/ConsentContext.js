import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { revokeOrderMetaConsent } from "../api/ordersApi";
import { setMetaConsent } from "../meta/pixel";
import { clearMetaCookies, CONSENT_STORAGE_KEY, readConsent, saveConsent } from "./consentStorage";

const ConsentContext = createContext(null);

function pendingOrders() {
  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith("orderAccessToken:"))
      .slice(0, 20)
      .map(key => ({ orderId: key.slice("orderAccessToken:".length), accessToken: localStorage.getItem(key) }))
      .filter(item => item.orderId && item.accessToken);
  } catch {
    return [];
  }
}

async function revokePendingOrderTracking() {
  await Promise.allSettled(pendingOrders().map(({ orderId, accessToken }) => revokeOrderMetaConsent(orderId, accessToken)));
}

export function ConsentProvider({ children }) {
  const [choice, setChoice] = useState(() => readConsent());
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useLayoutEffect(() => {
    setMetaConsent(choice?.marketing === true);
  }, [choice]);

  const choose = useCallback((marketing, source) => {
    const record = saveConsent(marketing, source);
    setMetaConsent(record.marketing);
    setChoice(record);
    setPreferencesOpen(false);
  }, []);

  useEffect(() => {
    if (choice && !choice.marketing) {
      clearMetaCookies();
      revokePendingOrderTracking();
    }
  }, [choice]);

  useEffect(() => {
    const synchronize = event => {
      if (event.key !== CONSENT_STORAGE_KEY) return;
      const next = readConsent();
      setMetaConsent(next?.marketing === true);
      setChoice(next);
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);

  const value = useMemo(() => ({
    choice,
    marketing: choice?.marketing === true,
    decided: Boolean(choice),
    preferencesOpen,
    acceptMarketing: () => choose(true, "banner_accept"),
    rejectMarketing: () => choose(false, "banner_reject"),
    savePreferences: marketing => choose(marketing, "preferences"),
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
  }), [choice, preferencesOpen, choose]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useCookieConsent() {
  const value = useContext(ConsentContext);
  if (!value) throw new Error("useCookieConsent debe usarse dentro de ConsentProvider");
  return value;
}
