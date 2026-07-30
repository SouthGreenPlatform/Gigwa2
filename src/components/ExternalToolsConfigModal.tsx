import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "../styles/external-tools-config-modal.scss";

function ExternalToolConfigModal({
  show,
  onClose,
  galaxyURL,
  setGalaxyURL,
  selectedTool,
  setSelectedTool,
  formats,
  setFormats,
  toolURL,
  setToolURL,
  isChanged,
  setIsChanged,
  onApply,
  onlineOutputTools = {}, // NEW
}) {
  const imgBasePath = `${import.meta.env.BASE_URL}img/`;
  const handleInputChange = (setter, value) => {
    setter(value);
    setIsChanged(true);
  };

  const handleToolSelect = (value) => {
    setSelectedTool(value);
    setIsChanged(true);

    if (onlineOutputTools[value]) {
      setFormats(onlineOutputTools[value].formats || "");
      setToolURL(onlineOutputTools[value].url || "");
    } else {
      setFormats("");
      setToolURL("");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered dialogClassName="external-tools-modal-dialog">
      <Modal.Header closeButton>
        <Modal.Title>Configure output push</Modal.Title>
      </Modal.Header>
      <Modal.Body className="external-tools-modal-body">
        <p className="external-tools-intro">
          Configure this to be able to push exported data into external online tools.
          This feature is available when the <strong>&ldquo;Keep files on server&rdquo;</strong> box is ticked.
        </p>

        <section className="external-tools-section">
          <div className="external-tools-section-title">
            <img alt="Galaxy" height="16" src={`${imgBasePath}logo-galaxy.png`} className="external-tools-galaxy-logo" />
            Galaxy
          </div>

          <Form.Group className="external-tools-field">
            <Form.Label>
              Favourite{" "}
              <a href="https://galaxyproject.org/" target="_blank" rel="noreferrer" className="external-tools-galaxy-link">
                Galaxy
              </a>{" "}
              instance URL
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="example: https://usegalaxy.org/"
              className="external-tools-input"
              value={galaxyURL}
              onChange={(e) => handleInputChange(setGalaxyURL, e.target.value)}
            />
            <Form.Text className="external-tools-hint">
              You will be requested to provide an API key to be able to push exported files there.
            </Form.Text>
          </Form.Group>
        </section>

        <section className="external-tools-section">
          <div className="external-tools-section-title">Custom / online tool</div>

          <Form.Group className="external-tools-field">
            <Form.Label>Tool preset</Form.Label>
            <Form.Select
              value={selectedTool}
              onChange={(e) => handleToolSelect(e.target.value)}
              className="external-tools-select"
            >
              <option value="">Custom tool</option>
              {Object.keys(onlineOutputTools).map((toolName) => (
                <option key={toolName} value={toolName}>
                  {toolName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="external-tools-field">
            <Form.Label>Supported formats (CSV)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Refer to export box contents (empty for all formats)"
              className="external-tools-input"
              value={formats}
              onChange={(e) => handleInputChange(setFormats, e.target.value)}
            />
          </Form.Group>

          <Form.Group className="external-tools-field">
            <Form.Label>Online tool URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="http://some-tool.org/import?fileUrl={vcf|vcf.gz}"
              className="external-tools-input"
              value={toolURL}
              onChange={(e) => handleInputChange(setToolURL, e.target.value)}
            />
            <Form.Text className="external-tools-hint">
              Use placeholders to specify extensions, e.g. <code>{`{don|tsv|phenotype}`}</code>. Leave blank to revert to default.
            </Form.Text>
          </Form.Group>
        </section>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="external-tools-apply-btn"
          disabled={!isChanged}
          onClick={() => {
            if (onApply) onApply();
            setIsChanged(false);
            onClose();
          }}
        >
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
}


export default ExternalToolConfigModal;
