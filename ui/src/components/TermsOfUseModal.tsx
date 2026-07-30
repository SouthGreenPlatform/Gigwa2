import React from "react";
import { Modal, Button } from "react-bootstrap";
import "../styles/terms-of-use.scss";

interface TermsOfUseModalProps {
  show: boolean;
  gaConsentEnabled: boolean;
  gaConsentChecked: boolean;
  onGaConsentChange: (checked: boolean) => void;
  customParagraphHtml: string | null;
  onClose: () => void;
  onAccept: () => void;
}

const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({
  show,
  gaConsentEnabled,
  gaConsentChecked,
  onGaConsentChange,
  customParagraphHtml,
  onClose,
  onAccept,
}) => {
  // The dialog can never be dismissed except by clicking Accept — no close button, no
  // Escape key, no backdrop click — always, whether this is the mandatory first-run
  // prompt or a voluntary reopen to review/change cookie preferences.
  return (
    <Modal
      show={show}
      onHide={onClose}
      backdrop="static"
      keyboard={false}
      scrollable
      centered
      size="lg"
      className="terms-of-use-modal"
    >
      <Modal.Header closeVariant="white">
        <Modal.Title>Gigwa - Terms of use</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="terms-of-use-note">
          This application uses cookies and browser storage that are necessary for it to work (for instance to keep you signed in
          and remember your preferences). Please read and accept the following terms of use before continuing.
        </div>

        <h6>1) Limitation of warranty</h6>
        <p>
          a) You acknowledge that the actual state of scientific and technical knowledge do not permit to test and check all uses
          of Gigwa, nor to detect the being of possible defaults. You acknowledge that the changes, the Use, the modification, the
          development, the reproduction of Gigwa are deemed to be executed by experimented users and contain risks. You are
          responsible for the checking by any means of fitness of Gigwa for your own purposes, of checking of its working, of its
          Use in conditions that do not cause damages to persons or goods.
        </p>
        <p>
          b) Gigwa is provided on a « as is » basis, without warranties express or implied other than its existence, including all
          disclaimer of warranty relating to a title or deed (of property or exploitation), the lack of infringement, the
          merchantability, the secured, innovative or accurate features of Gigwa, the lack of mistakes, the suitability with Your
          equipment and/or software configuration.
        </p>

        <h6>2) Disclaimer of liability</h6>
        <p>a) CIRAD or IRD can not be held responsible towards anyone:</p>
        <ol type="i">
          <li>for any damage due to the complete or partial breach of Your obligations;</li>
          <li>
            for any direct or indirect damages resulting of the Use or the performance of Gigwa caused to the Final User when he
            is a professional using Gigwa for professional purposes;
          </li>
          <li>for any indirect damage arising from the Use or the performances of Gigwa</li>
        </ol>
        <p>
          b) The parties agree expressly that any financial or commercial prejudice (for instance loose of data, loose of
          customers or orders, loose of benefit, trading loss, misses to gain, commercial disorder) or any action suited against
          You by a third party is considered as an indirect damage and can not be subject of a indemnifying by CIRAD or IRD.
        </p>

        <h6>3) Applicable law</h6>
        <p>
          This contract and all disputes arising out of the execution or interpretation of this license shall be governed by
          French law.
        </p>

        {gaConsentEnabled && (
          <>
            <h6>Cookie consent</h6>
            <p>
              This website uses Google Analytics to analyze anonymized traffic and improve your experience. You can choose to
              accept or decline the use of cookies for analytics purposes. You can change your preference at any time by
              reopening this Terms of use dialog.
            </p>
            <label className="terms-of-use-checkbox">
              <input
                type="checkbox"
                checked={gaConsentChecked}
                onChange={(e) => onGaConsentChange(e.target.checked)}
              />
              I consent to the use of cookies for analytics purposes.
            </label>
          </>
        )}

        {customParagraphHtml && (
          <div className="terms-of-use-custom" dangerouslySetInnerHTML={{ __html: customParagraphHtml }} />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" className="terms-accept-btn" onClick={onAccept}>Accept</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TermsOfUseModal;
