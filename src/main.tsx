import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const path = window.location.pathname;
if (!path.endsWith('/') && !path.endsWith('/index.html')) {
  window.location.replace(path + '/' + window.location.search + window.location.hash);
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