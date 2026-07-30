import config from "../config/config";
import endpoints from "../endpoints";

function matchesDomain(hostname: string, pattern: string): boolean {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1); // e.g. ".southgreen.fr"
    return hostname === pattern.slice(2) || hostname.endsWith(suffix);
  }
  return hostname === pattern;
}

export function shouldProxy(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return config.IGV_PROXIED_DOMAINS.some(pattern => matchesDomain(hostname, pattern));
  } catch {
    return false;
  }
}

export function proxyUrl(url: string): string {
  return shouldProxy(url) ? `${endpoints.IGV_PROXY_URL}?url=${encodeURIComponent(url)}` : url;
}

// Recursively apply proxyUrl to all URL-typed string fields (keys named "url", or ending with "URL" / "Url")
export function proxyConfig<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(proxyConfig) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (typeof val === "string" && (key === "url" || key.endsWith("URL") || key.endsWith("Url"))) {
        result[key] = proxyUrl(val);
      } else {
        result[key] = proxyConfig(val);
      }
    }
    return result;
  }
  return obj;
}
