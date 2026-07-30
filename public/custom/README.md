# Per-deployment branding (`public/custom/`)

Everything in this directory except this file is gitignored — it holds
optional, deployment-specific branding. None of these files exist in a fresh
checkout, and the app looks exactly as it does without this folder until you
add them.

Because this lives under `public/`, Vite copies it into `dist/` **verbatim**
at build time and the app reads it back **at runtime** via `fetch()` — so
unlike a source-level override, you can add or edit these files directly in
an already-built `dist/` folder and just reload the page. No rebuild needed.

## Colors — `colors.json`

Optional. If present, overrides any of the color tokens below (anything you
leave out keeps its default). Applied by setting CSS custom properties
(`--gigwa-<name>`) on page load — see `src/tools/customBranding.ts` and the
matching `var(--gigwa-<name>, <default>)` fallbacks in `src/styles/_shared.scss`.

```json
{
  "primary-color": "#0057b8",
  "primary-hover": "#00438f",
  "primary-active": "#003269",
  "primary-light": "#e6f0fb",
  "header-bg": "#012a5c",
  "header-bg-alt": "#001c3d",
  "danger-color": "#ef4444",
  "danger-hover": "#dc2626",
  "danger-light": "#fee2e2",
  "secondary-color": "#6b7280",
  "secondary-hover": "#4b5563",
  "success-color": "#16a34a",
  "success-hover": "#15803d",
  "success-light": "#dcfce7"
}
```

## Logo — `logo.json` + image file

Optional. If present, a logo is shown in the navbar next to the "Gigwa"
wordmark. Absent by default — no logo is shown.

Read at runtime (see `src/hooks/useCustomLogo.ts`), same as `colors.json` —
drop both files into an already-built `dist/custom/` and just reload the
page, no rebuild needed.

Add a `logo.json` manifest naming the actual image file (any name/extension,
e.g. `logo.svg`, `logo.png`), plus an optional `href` to make the logo a
link (opens in a new tab):

```json
{ "file": "logo.svg", "href": "https://example.org" }
```

Then place the referenced image file (e.g. `logo.svg`) alongside `logo.json`
in this same directory.
