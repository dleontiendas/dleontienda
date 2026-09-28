import React, { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CookieConsent from "./CookieConsent";
import { ConsentProvider, useCookieConsent } from "./ConsentContext";
import { CONSENT_STORAGE_KEY } from "./consentStorage";
import { revokeOrderMetaConsent } from "../api/ordersApi";
import { setMetaConsent } from "../meta/pixel";

jest.mock("../api/ordersApi", () => ({ revokeOrderMetaConsent: jest.fn(() => Promise.resolve({ success: true })) }));
jest.mock("../meta/pixel", () => ({ setMetaConsent: jest.fn() }));

function OpenPreferences() {
  const consent = useCookieConsent();
  useEffect(() => { consent.openPreferences(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });

test("does not preselect marketing and records explicit acceptance", () => {
  render(<MemoryRouter><ConsentProvider><CookieConsent /></ConsentProvider></MemoryRouter>);
  expect(screen.getByRole("dialog", { name: "Tu privacidad y tus cookies" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Personalizar" }));
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar preferencias" }));
  expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY))).toMatchObject({ necessary: true, marketing: true, source: "preferences" });
  expect(setMetaConsent).toHaveBeenLastCalledWith(true);
});

test("rejection is as accessible as acceptance and revokes pending order tracking", async () => {
  localStorage.setItem("orderAccessToken:order-1", "private-token");
  render(<MemoryRouter><ConsentProvider><CookieConsent /></ConsentProvider></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Rechazar marketing" }));
  expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)).marketing).toBe(false);
  expect(setMetaConsent).toHaveBeenLastCalledWith(false);
  await waitFor(() => expect(revokeOrderMetaConsent).toHaveBeenCalledWith("order-1", "private-token"));
});

test("a saved choice can be changed later", () => {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: "2026-09-27", necessary: true, marketing: true, decidedAt: new Date().toISOString(), source: "banner_accept" }));
  render(<MemoryRouter><ConsentProvider><OpenPreferences /><CookieConsent /></ConsentProvider></MemoryRouter>);
  expect(screen.getByRole("checkbox")).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Rechazar marketing" }));
  expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)).marketing).toBe(false);
});
