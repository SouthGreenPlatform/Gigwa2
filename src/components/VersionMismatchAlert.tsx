import { useState } from "react";
import { Alert } from "react-bootstrap";

interface VersionMismatchAlertProps {
  show: boolean;
  buildVersion: string;
  backendVersion: string | null;
}

const VersionMismatchAlert = ({ show, buildVersion, backendVersion }: VersionMismatchAlertProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <Alert variant="warning" dismissible onClose={() => setDismissed(true)} className="mb-0 rounded-0 text-center">
      This interface was built for Gigwa v{buildVersion}, but the server is running {backendVersion}. Some features may not work as expected — please reload after clearing your browser cache, or contact your administrator if this persists.
    </Alert>
  );
};

export default VersionMismatchAlert;
