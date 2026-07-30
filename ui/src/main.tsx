import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Ensure index.html is explicit in the URL so that HashRouter deep links are copyable
if (!window.location.pathname.endsWith('/index.html')) {
  const base = window.location.pathname.replace(/\/?$/, '/index.html');
  window.location.replace(base + window.location.search + window.location.hash);
}

import "./styles/index.scss";
import "./styles/custom.scss";

import App from "./App.tsx";
import { applyCustomBranding } from "./tools/customBranding.ts";
// import { AuthProvider } from "./contexts/Authentication.tsx";

applyCustomBranding().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* <AuthProvider> */}
        <App />
      {/* </AuthProvider> */}
    </StrictMode>,
  );
});