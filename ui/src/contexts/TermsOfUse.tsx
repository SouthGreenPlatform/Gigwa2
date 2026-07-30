import React, { createContext, useContext, ReactNode } from "react";
import { useTermsOfUse } from "../hooks/useTermsOfUse";
import TermsOfUseModal from "../components/TermsOfUseModal";

type TermsOfUseContextValue = ReturnType<typeof useTermsOfUse>;

const TermsOfUseContext = createContext<TermsOfUseContextValue | undefined>(undefined);

// Mounted once at the app root (see App.tsx) so the mandatory consent check runs
// regardless of which route a user lands on directly (e.g. a deep link straight into
// /investigate/..., not just the Home page).
export function TermsOfUseProvider({ children }: { children: ReactNode }) {
  const termsOfUse = useTermsOfUse();

  return (
    <TermsOfUseContext.Provider value={termsOfUse}>
      {children}
      <TermsOfUseModal
        show={termsOfUse.show}
        gaConsentEnabled={termsOfUse.gaConsentEnabled}
        gaConsentChecked={termsOfUse.gaConsentChecked}
        onGaConsentChange={termsOfUse.setGaConsentChecked}
        customParagraphHtml={termsOfUse.customParagraphHtml}
        onClose={termsOfUse.closeTermsOfUse}
        onAccept={termsOfUse.acceptTerms}
      />
    </TermsOfUseContext.Provider>
  );
}

export function useTermsOfUseContext() {
  const ctx = useContext(TermsOfUseContext);
  if (!ctx) throw new Error("useTermsOfUseContext must be used within a TermsOfUseProvider");
  return ctx;
}
