// FILE: src/AppProviders.jsx
import React from "react";
import { HelmetProvider } from "react-helmet-async";

export default function AppProviders({ children }) {
  return <HelmetProvider>{children}</HelmetProvider>;
}

// --- Asegúrate de envolver tu App en AppProviders, por ejemplo en main.jsx ---
// FILE: src/main.jsx (ejemplo mínimo)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppProviders from "./AppProviders.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);

