import React from "react";
import { Modal } from "react-bootstrap";
import "../styles/full-modal.scss";

interface GenericModalProps {
  show: boolean;
  title?: string;
  showHeader?: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

const FullModal: React.FC<GenericModalProps> = ({ show, title, showHeader = true, children, onClose }) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      fullscreen
      contentClassName="h-100 rounded-0"
      dialogClassName="h-100 m-0"
    >
      {showHeader && (
        <div className="modal-header d-flex flex-wrap align-items-center gap-2 full-modal-header">
          <div className="me-auto full-modal-title">
            {title || ""}
          </div>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
      )}
      <Modal.Body className="full-modal-body">{children}</Modal.Body>
    </Modal>
  );
};

export default FullModal;