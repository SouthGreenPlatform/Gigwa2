const config: { INSTANCE_URL: string; IGV_PROXIED_DOMAINS: string[] } = {
    //INSTANCE_URL:                   "https://gigwa-dev.southgreen.fr/gigwaV2",
    // INSTANCE_URL:                   "http://localhost:9090/Gigwa2/",
    INSTANCE_URL:                   "",
    IGV_PROXIED_DOMAINS:            ["*.southgreen.fr"],           //FIXME: this should be obtained dynamically
};

if (!config.INSTANCE_URL) {
    // No INSTANCE_URL configured: assume the backend is reachable one level above where this UI is served from (e.g. ".../Gigwa2/v3/" -> ".../Gigwa2/")
    const segments = window.location.pathname.split("/");
    const v3Index = segments.indexOf("v3");
    config.INSTANCE_URL = window.location.origin + (v3Index === -1 ? "" : segments.slice(0, v3Index).join("/"));
}

export default config;
