import { setMetaConsent, trackMeta, trackPurchase, trackProduct, checkoutTracking } from "./pixel";
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter, Link, useNavigate } from "react-router-dom";
import MetaPageView from "./MetaPageView";
import { CONSENT_VERSION, saveConsent } from "../consent/consentStorage";
jest.mock("../consent/ConsentContext", () => ({ useCookieConsent: () => ({ marketing: true }) }));
const originalLocation = window.location;
beforeEach(() => {
  delete window.location; window.location = { hostname: "dleongold.com", pathname: "/moda", search: "" };
  localStorage.clear(); delete window.fbq;
  process.env.REACT_APP_META_ENABLED = "false"; process.env.REACT_APP_META_PIXEL_ID = "123";
  setMetaConsent(false);
});
afterAll(() => { delete window.location; window.location = originalLocation; });
test("no scripts, cookies or events by default or without consent", () => {
  expect(trackMeta("PageView")).toBe(false); expect(checkoutTracking()).toBeUndefined();
  expect(document.querySelector('script[src*="facebook"]')).toBeNull();
  process.env.REACT_APP_META_ENABLED = "true";
  expect(trackMeta("PageView")).toBe(false);
});
test("one event despite duplicate React effects and revocation blocks subsequent calls", () => {
  process.env.REACT_APP_META_ENABLED = "true";
  setMetaConsent(true); window.fbq = jest.fn();
  expect(trackMeta("PageView", {}, "same-page")).toBe(true);
  expect(trackMeta("PageView", {}, "same-page")).toBe(false);
  expect(window.fbq.mock.calls.filter(call => call[0] === "trackSingle")).toHaveLength(1);
  setMetaConsent(false); expect(trackMeta("PageView", {}, "other")).toBe(false);
});
test("plus-price event uses selected variant; Purchase requires server payload and is deduplicated", () => {
  process.env.REACT_APP_META_ENABLED = "true"; setMetaConsent(true); window.fbq = jest.fn();
  trackProduct("AddToCart", { sku: "J", name: "Jeans", price_cop: 100000, variants: [{ color: "AZUL", tallas: [{ size: "42", price_cop: 130000, sku_master: "PLUS" }] }] }, "AZUL", "42", 2, "add-plus");
  expect(window.fbq).toHaveBeenCalledWith("trackSingle", "123", "AddToCart", expect.objectContaining({ value: 260000, content_ids: ["v:PLUS"] }), { eventID: "add-plus" });
  expect(trackPurchase({ paymentStatus: "APPROVED" })).toBe(false);
  const order = { metaPurchase: { eventId: "purchase:o", data: { value: 130000, content_ids: ["v:PLUS"] } } };
  expect(trackPurchase(order)).toBe(true); expect(trackPurchase(order)).toBe(false);
  expect(trackMeta("AddPaymentInfo", { order_id: "o", payment_method: "WOMPI", value: 130000 }, "payment:o")).toBe(true);
  expect(window.fbq).toHaveBeenCalledWith("trackSingle", "123", "AddPaymentInfo", expect.objectContaining({ order_id: "o", payment_method: "WOMPI" }), { eventID: "payment:o" });
});
test("checkout attribution includes the recorded consent evidence", () => {
  process.env.REACT_APP_META_ENABLED = "true";
  const record = saveConsent(true, "preferences");
  setMetaConsent(true);
  expect(checkoutTracking()).toMatchObject({
    consent: true,
    policyVersion: "meta-v1",
    consentVersion: CONSENT_VERSION,
    consentAt: record.decidedAt,
  });
});
test("sensitive query strings and local environments never track", () => {
  process.env.REACT_APP_META_ENABLED = "true"; setMetaConsent(true); window.fbq = jest.fn();
  window.location.search = "?q=person@example.com"; expect(trackMeta("Search")).toBe(false);
  window.location.search = ""; window.location.hostname = "localhost"; expect(trackMeta("PageView")).toBe(false);
});
test("StrictMode does not duplicate PageView, but returning in history is a new visit", () => {
  process.env.REACT_APP_META_ENABLED = "true"; setMetaConsent(true); window.fbq = jest.fn();
  function Navigation() { const navigate = useNavigate(); return <><MetaPageView /><Link to="/bolsos">Bolsos</Link><button onClick={() => navigate(-1)}>Volver</button></>; }
  render(<React.StrictMode><MemoryRouter initialEntries={["/moda"]}><Navigation /></MemoryRouter></React.StrictMode>);
  const events = () => window.fbq.mock.calls.filter(call => call[0] === "trackSingle");
  expect(events()).toHaveLength(1);
  fireEvent.click(screen.getByText("Bolsos")); expect(events()).toHaveLength(2);
  fireEvent.click(screen.getByText("Volver")); expect(events()).toHaveLength(3);
});
