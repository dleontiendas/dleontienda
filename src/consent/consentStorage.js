export const CONSENT_STORAGE_KEY = "dleonCookieConsent";
export const CONSENT_VERSION = "2026-09-27";

function validRecord(value) {
  return value && value.version === CONSENT_VERSION
    && value.necessary === true
    && typeof value.marketing === "boolean"
    && typeof value.decidedAt === "string"
    && !Number.isNaN(Date.parse(value.decidedAt));
}

export function readConsent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    return validRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(marketing, source = "preferences") {
  const record = {
    version: CONSENT_VERSION,
    necessary: true,
    marketing: marketing === true,
    decidedAt: new Date().toISOString(),
    source,
  };
  try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record)); } catch { /* Apply the in-memory choice even if storage is unavailable. */ }
  return record;
}

export function clearMetaCookies() {
  if (typeof document === "undefined") return;
  const domains = ["", "dleongold.com", ".dleongold.com"];
  for (const name of ["_fbp", "_fbc"]) {
    for (const domain of domains) {
      try { document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`; } catch { /* Continue revoking other accessible cookies. */ }
    }
  }
}
