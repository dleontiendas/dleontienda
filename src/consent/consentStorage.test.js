import { clearMetaCookies, CONSENT_STORAGE_KEY, CONSENT_VERSION, readConsent, saveConsent } from "./consentStorage";

beforeEach(() => { localStorage.clear(); document.cookie = "_fbp=; Max-Age=0; Path=/"; document.cookie = "_fbc=; Max-Age=0; Path=/"; });

test("stores an explicit, versioned and dated choice", () => {
  const record = saveConsent(false, "banner_reject");
  expect(record).toMatchObject({ version: CONSENT_VERSION, necessary: true, marketing: false, source: "banner_reject" });
  expect(Number.isNaN(Date.parse(record.decidedAt))).toBe(false);
  expect(readConsent()).toEqual(record);
});

test("ignores stale or malformed consent records", () => {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: "old", necessary: true, marketing: true, decidedAt: new Date().toISOString() }));
  expect(readConsent()).toBeNull();
  localStorage.setItem(CONSENT_STORAGE_KEY, "not-json");
  expect(readConsent()).toBeNull();
});

test("removes accessible Meta attribution cookies", () => {
  document.cookie = "_fbp=fb.1.1700000000000.123; Path=/";
  document.cookie = "_fbc=fb.1.1700000000000.click; Path=/";
  clearMetaCookies();
  expect(document.cookie).not.toContain("_fbp=");
  expect(document.cookie).not.toContain("_fbc=");
});
