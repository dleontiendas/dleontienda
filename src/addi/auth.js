

const ADDI_CLIENT_ID = "6XcR15K52qpgpBiJgtK7wbq0b3WtZjfK";
const ADDI_CLIENT_SECRET = "-Fg89M1KA9lFbG-aXztS0LSqlwkHu2tu2SNyPCcX-pLKBwfcOTxIyM7hK7wDgqug";


import fetch from "node-fetch";

export const getAddiToken = async () => {
  const res = await fetch("https://api.addi.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: ADDI_CLIENT_ID,
      client_secret: ADDI_CLIENT_SECRET,
      audience: "https://api.addi.com",
    }),
  });

  if (!res.ok) {
    throw new Error("Error autenticando con ADDI");
  }

  const data = await res.json();
  return data.access_token;
};
