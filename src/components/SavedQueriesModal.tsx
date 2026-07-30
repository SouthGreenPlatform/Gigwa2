import React from "react";
import { Modal, ListGroup, Row, Col, Button } from "react-bootstrap";

interface SavedQueriesModalProps {
  show: boolean;
  savedQueries: Record<string, string>;

  onClose: () => void;
  onLoad: (queryId: string) => void;
  onRename: () => void;
  onDelete: (queryId: string) => void;
}

const SavedQueriesModal: React.FC<SavedQueriesModalProps> = ({
  show,
  savedQueries,
  onClose,
  onLoad,
  onRename,
  onDelete,
}) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      aria-labelledby="saved-queries-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Your queries</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup variant="flush">
          {Object.entries(savedQueries).map(([queryId, queryName]) => (
            <ListGroup.Item key={queryId}>
              <Row className="align-items-center">
                <Col className="text-start">
                  <strong>{queryName}</strong>
                </Col>

                <Col xs="auto" className="d-flex gap-2 justify-content-end">
                  <Button
                    size="sm"
                    className="filter-card-btn-load"
                    onClick={() => {
                      onClose();
                      onLoad(queryId);
                    }}
                  >
                    Load
                  </Button>

                  <Button
                    size="sm"
                    className="filter-card-btn-rename"
                    onClick={() => {
                      onClose();
                      onRename();
                    }}
                  >
                    Rename
                  </Button>

                  <Button
                    size="sm"
                    className="filter-card-btn-delete"
                    onClick={() => {
                      onClose();
                      onDelete(queryId);
                    }}
                  >
                    Delete
                  </Button>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
};

export default SavedQueriesModal;