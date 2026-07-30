// Applies a per-deployment color override, read at RUNTIME from a static JSON file
// (see public/custom/README.md) — works against an already-built dist/, no rebuild
// needed, unlike the matching Sass fallback values in src/styles/_shared.scss.
const CUSTOM_COLOR_KEYS = [
  "primary-color",
  "primary-hover",
  "primary-active",
  "primary-light",
  "header-bg",
  "header-bg-alt",
  "danger-color",
  "danger-hover",
  "danger-light",
  "secondary-color",
  "secondary-hover",
  "success-color",
  "success-hover",
  "success-light",
] as const;

export async function applyCustomBranding(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}custom/colors.json`);
    if (!response.ok) return; // no override file for this deployment — keep defaults

    const overrides: Record<string, string> = await response.json();
    for (const key of CUSTOM_COLOR_KEYS) {
      const value = overrides[key];
      if (value) document.documentElement.style.setProperty(`--gigwa-${key}`, value);
    }
  } catch {
    // Missing/invalid file, or fetch failed — keep defaults, nothing to do.
  }
}
