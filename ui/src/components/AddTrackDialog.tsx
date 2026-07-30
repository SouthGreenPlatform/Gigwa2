import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { proxyUrl } from "../tools/igvProxy";
import "../styles/igv-dialogs.scss";

interface AddTrackDialogProps {
  show: boolean;
  onClose: () => void;
  onAddTrack: (trackConfig: { url: string; name: string; type: string; indexUrl?: string; format:string }) => void;
}

const AddTrackDialog: React.FC<AddTrackDialogProps> = ({ show, onClose, onAddTrack }) => {
  const [inputType, setInputType] = useState<"url" | "file">("url");
  const [trackUrl, setTrackUrl] = useState("");
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [indexUrl, setIndexUrl] = useState("");
  const [trackName, setTrackName] = useState("");
  const [trackType, setTrackType] = useState("annotation");
  const [error, setError] = useState<string | null>(null);

  const inferFormat = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".bed")) return "bed";
    if (name.endsWith(".vcf") || name.endsWith(".vcf.gz")) return "vcf";
    if (name.endsWith(".bam")) return "bam";
    if (name.endsWith(".bigwig") || name.endsWith(".bw")) return "bigwig";
    if (name.endsWith(".txt.gz") && name.includes("refgene")) return "refgene";
    // add more as needed
    return undefined;
  };

  const handleSubmit = () => {
    if (inputType === "url") {
      if (!trackUrl) { setError("Track URL is required."); return; }
      onAddTrack({ url: proxyUrl(trackUrl), name: trackName, type: trackType, indexUrl: indexUrl ? proxyUrl(indexUrl) : undefined, format: undefined });
      onClose();
      return;
    }
    if (inputType === "file" && trackFile) {
      const format = inferFormat(trackFile);
      const fileUrl = URL.createObjectURL(trackFile);
      const indexFileUrl = indexFile ? URL.createObjectURL(indexFile) : undefined;
      onAddTrack({ url: fileUrl, name: trackName, type: trackType, indexUrl: indexFileUrl, format });
      onClose();
      return;
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered className="igv-dialog-modal">
      <Modal.Header closeButton>
        <Modal.Title>Add Track</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Input Type</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="URL"
                id="input-type-url"
                name="inputType"
                value="url"
                checked={inputType === "url"}
                onChange={() => setInputType("url")}
              />
              <Form.Check
                inline
                type="radio"
                label="Local File"
                id="input-type-file"
                name="inputType"
                value="file"
                checked={inputType === "file"}
                onChange={() => setInputType("file")}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Track Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter track name"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Track Type</Form.Label>
            <Form.Select
              value={trackType}
              onChange={(e) => setTrackType(e.target.value)}
            >
              <option value="annotation">Annotation</option>
              <option value="variant">Variant</option>
              <option value="alignment">Alignment</option>
              <option value="wig">Wig</option>
            </Form.Select>
          </Form.Group>

          {inputType === "url" ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Track URL</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter track URL"
                  value={trackUrl}
                  onChange={(e) => setTrackUrl(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Index URL (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter index URL"
                  value={indexUrl}
                  onChange={(e) => setIndexUrl(e.target.value)}
                />
              </Form.Group>
            </>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Track File</Form.Label>
                <Form.Control
                  type="file"
                  accept=".bed,.vcf,.bam,.bigwig,.txt.gz"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackFile(e.target.files ? e.target.files[0] : null)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Index File (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".bai,.csi,.tbi"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIndexFile(e.target.files ? e.target.files[0] : null)}
                />
              </Form.Group>
            </>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Add Track
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddTrackDialog;