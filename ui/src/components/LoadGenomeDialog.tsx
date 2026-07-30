import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { proxyConfig } from "../tools/igvProxy";
import "../styles/igv-dialogs.scss";

interface LoadGenomeDialogProps {
  show: boolean;
  onClose: () => void;
  onLoadGenome: (genomeConfig: any) => void;
}

export default function LoadGenomeDialog({ show, onClose, onLoadGenome }: LoadGenomeDialogProps) {
  const [inputType, setInputType] = useState<"url" | "file">("url");
  const [genomeName, setGenomeName] = useState("");
  const [fastaUrl, setFastaUrl] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [cytobandUrl, setCytobandUrl] = useState("");
  const [fastaFile, setFastaFile] = useState<File | null>(null);
  const [indexFile, setIndexFile] = useState<File | null>(null);
  const [cytobandFile, setCytobandFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let genomeConfig: any = {
        id: genomeName.toLowerCase().replace(/\s+/g, "_"),
        name: genomeName,
      };

      if (inputType === "url") {
        if (!fastaUrl || !genomeName) {
          setError("Genome name and FASTA URL are required.");
          setIsLoading(false);
          return;
        }
        genomeConfig.fastaURL = fastaUrl;
        genomeConfig.indexURL = indexUrl || undefined;
        // Assign cytobandBbURL or cytobandURL based on extension
        if (cytobandUrl.endsWith(".bb")) {
          genomeConfig.cytobandBbURL = cytobandUrl;
        } else if (cytobandUrl.endsWith(".txt.gz")) {
          genomeConfig.cytobandURL = cytobandUrl;
        } else if (cytobandUrl) {
          setError("Cytoband URL must end with .bb or .txt.gz");
          setIsLoading(false);
          return;
        }
      } else {
        if (!fastaFile || !genomeName) {
          setError("Genome name and FASTA file are required.");
          setIsLoading(false);
          return;
        }
        genomeConfig.fastaURL = URL.createObjectURL(fastaFile);
        genomeConfig.indexURL = indexFile ? URL.createObjectURL(indexFile) : undefined;
        // Assign cytobandBbURL or cytobandURL based on extension
        if (cytobandFile) {
          if (cytobandFile.name.endsWith(".bb")) {
            genomeConfig.cytobandBbURL = URL.createObjectURL(cytobandFile);
          } else if (cytobandFile.name.endsWith(".txt.gz")) {
            genomeConfig.cytobandURL = URL.createObjectURL(cytobandFile);
          } else {
            setError("Cytoband file must be .bb or .txt.gz");
            setIsLoading(false);
            return;
          }
        }
      }

      onLoadGenome(proxyConfig(genomeConfig));
      onClose();
    } catch (error) {
      console.error("Error loading genome:", error);
      setError("Failed to load genome. Please check the inputs and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered className="igv-dialog-modal">
      <Modal.Header closeButton>
        <Modal.Title>Load Genome</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
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
            <Form.Label>Genome Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Custom Genome"
              value={genomeName}
              onChange={(e) => setGenomeName(e.target.value)}
              required
            />
          </Form.Group>

          {inputType === "url" ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>FASTA URL (required)</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/genome.fa"
                  value={fastaUrl}
                  onChange={(e) => setFastaUrl(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  URL to the FASTA file containing the reference genome sequence.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Index URL (Optional)</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/genome.fa.fai"
                  value={indexUrl}
                  onChange={(e) => setIndexUrl(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Cytoband URL (Optional, <code>.bb</code> or <code>.txt.gz</code>)
                </Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/cytoBand.bb or .txt.gz"
                  value={cytobandUrl}
                  onChange={(e) => setCytobandUrl(e.target.value)}
                />
              </Form.Group>
            </>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>FASTA File (required)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".fa,.fasta"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFastaFile(e.target.files ? e.target.files[0] : null)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Index File (Optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".fai"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIndexFile(e.target.files ? e.target.files[0] : null)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Cytoband File (Optional, <code>.bb</code> or <code>.txt.gz</code>)
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".bb,.txt.gz"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCytobandFile(e.target.files ? e.target.files[0] : null)}
                />
              </Form.Group>
            </>
          )}

          {error && <div className="alert alert-danger">{error}</div>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load Genome"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}