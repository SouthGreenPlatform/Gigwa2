import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    // Set via the APP_VERSION env var by Gigwa2's Maven build; falls back to "dev" for standalone/local builds
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || "dev"),
  },
  /*optimizeDeps: {
    exclude: ['igv'],
  },*/
});
