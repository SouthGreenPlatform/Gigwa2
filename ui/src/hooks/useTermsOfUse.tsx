import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getCookie, setCookie, deleteCookie } from "../tools/cookies";
import { getConfigParam } from "../tools/commons";
import endpoints from "../endpoints";

// Cookie names match the legacy JSP front-end (navbar.jsp / index.jsp) so that consent
// already given through either front-end is honored by the other.
const TERMS_COOKIE_NAME = "termsOfUseAgreed";
const GA_CONSENT_COOKIE_NAME = "cookieConsent";
const DEFAULT_COOKIE_DURATION_HOURS = 72; // same fallback as GigwaRestController#getTermsOfUseCookieDurationInHours

// Older builds of this component stored consent under this name; migrate it transparently.
const LEGACY_TERMS_COOKIE_NAME = "gigwa_terms_consent";

function readInitialConsent(): boolean {
  if (getCookie(TERMS_COOKIE_NAME) === "true") return true;
  if (getCookie(LEGACY_TERMS_COOKIE_NAME) === "accepted") {
    setCookie(TERMS_COOKIE_NAME, "true", DEFAULT_COOKIE_DURATION_HOURS / 24);
    deleteCookie(LEGACY_TERMS_COOKIE_NAME);
    return true;
  }
  return false;
}

let gaScriptLoaded = false;

function loadGA4Script(googleAnalyticsId: string) {
  if (gaScriptLoaded) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
  document.head.appendChild(script);
  (window as any).dataLayer = (window as any).dataLayer || [];
  const gtag = (...args: any[]) => { (window as any).dataLayer.push(args); };
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", googleAnalyticsId, { anonymize_ip: true });
  gaScriptLoaded = true;
}

export const useTermsOfUse = () => {
  const [show, setShow] = useState(false);
  const [hasConsented, setHasConsented] = useState(readInitialConsent);
  const [cookieDurationHours, setCookieDurationHours] = useState(DEFAULT_COOKIE_DURATION_HOURS);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState<string | null>(null);
  const [customParagraphHtml, setCustomParagraphHtml] = useState<string | null>(null);
  const [gaConsentChecked, setGaConsentChecked] = useState(() => getCookie(GA_CONSENT_COOKIE_NAME) !== "false");

  // Prompt automatically whenever this hook mounts (e.g. landing on the Home page) if consent hasn't been given yet
  useEffect(() => {
    if (!hasConsented) setShow(true);

    axios.get<string>(endpoints.TERMS_OF_USE_COOKIE_DURATION_URL).then(res => {
      const hours = parseInt(String(res.data), 10);
      if (!isNaN(hours) && hours >= 0) setCookieDurationHours(hours);
    }).catch(() => {});

    getConfigParam("googleAnalyticsId").then(id => setGoogleAnalyticsId(id || null));
    getConfigParam("customTermsOfUseHtmlParagraph").then(html => setCustomParagraphHtml(html || null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load GA4 as soon as we know both the tracking id and that the user had already consented on a previous visit
  useEffect(() => {
    if (googleAnalyticsId && hasConsented && getCookie(GA_CONSENT_COOKIE_NAME) === "true") {
      loadGA4Script(googleAnalyticsId);
    }
  }, [googleAnalyticsId, hasConsented]);

  const openTermsOfUse = useCallback(() => setShow(true), []);
  const closeTermsOfUse = useCallback(() => setShow(false), []);

  const acceptTerms = useCallback(() => {
    setCookie(TERMS_COOKIE_NAME, "true", cookieDurationHours / 24);
    setCookie(GA_CONSENT_COOKIE_NAME, gaConsentChecked ? "true" : "false", cookieDurationHours / 24);
    setHasConsented(true);
    setShow(false);

    if (gaConsentChecked && googleAnalyticsId) loadGA4Script(googleAnalyticsId);
    else if (!gaConsentChecked && gaScriptLoaded) setTimeout(() => window.location.reload(), 150); // there is no clean way to unload gtag, so reload without it (delayed so the modal visibly closes first)
  }, [cookieDurationHours, gaConsentChecked, googleAnalyticsId]);

  return {
    show,
    hasConsented,
    gaConsentEnabled: !!googleAnalyticsId,
    gaConsentChecked,
    setGaConsentChecked,
    customParagraphHtml,
    openTermsOfUse,
    closeTermsOfUse,
    acceptTerms,
  };
};
