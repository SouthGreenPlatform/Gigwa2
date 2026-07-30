import { useEffect, useState } from "react";


interface CustomLogoConfig {
  file?: string;
  href?: string;
}

export function useCustomLogo() {
  const [config, setConfig] = useState<CustomLogoConfig | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}custom/logo.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const logoUrl = config?.file ? `${import.meta.env.BASE_URL}custom/${config.file}` : undefined;
  return { logoUrl, logoHref: config?.href };
}
