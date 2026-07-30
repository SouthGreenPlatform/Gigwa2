import React from "react";
import { Modal, Button, Form, Row } from "react-bootstrap";

interface InputLookupModalProps {
  show: boolean;
  title: string;
  instructionText: string;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

export default function InputLookupModal({
  show,
  title,
  instructionText,
  value,
  onChange,
  onApply,
  onCancel,
}: InputLookupModalProps) {
  return (
    <Modal show={show} onHide={onCancel} centered size="lg" className="input-lookup-modal">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row>
          <p>{instructionText}</p>
          <Form.Control
            as="textarea"
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="danger" onClick={onCancel}>
          Cancel
        </Button>
        <Button  variant="primary" onClick={onApply}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
