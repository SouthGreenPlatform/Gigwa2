import { useEffect, useState } from "react";
import axios from "axios";
import endpoints from "../endpoints";

// Version this UI was built with (see vite.config.ts). "dev" means it wasn't built via Gigwa2's
// Maven build (e.g. plain `npm run build`/`npm run dev`), so there's nothing meaningful to compare.
export const BUILD_VERSION: string = __APP_VERSION__;

export const useVersionCheck = () => {
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    axios.get<string>(endpoints.VERSION_URL).then(res => {
      const version = String(res.data).trim();
      setBackendVersion(version);

      if (BUILD_VERSION !== "dev" && version.replace(/^v/i, "") !== BUILD_VERSION) {
        setMismatch(true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (backendVersion) document.title = `Gigwa ${backendVersion.startsWith("v") ? backendVersion : "v" + backendVersion}`;
  }, [backendVersion]);

  return { backendVersion, mismatch };
};
