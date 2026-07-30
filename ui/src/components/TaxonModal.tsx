import React, { useState } from 'react';
import { Modal, Button, Form} from 'react-bootstrap';
import axios from 'axios';
import { FiExternalLink } from 'react-icons/fi';

type TaxonModalProps = {
  show: boolean;
  onClose: () => void;
  onSelect: (scientificName: string) => void;
};

const TaxonModal: React.FC<TaxonModalProps> = ({
  show,
  onClose,
  onSelect,
}) => {
  const [taxonInput, setTaxonInput] = useState<string>('');

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaxonInput(e.target.value);
  };

  const handleValidate = async () => {

    const isNumeric = /^\d+$/.test(taxonInput);

    if (isNumeric) {
      try {
        const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
          params: {
            db: 'taxonomy',
            retmode: 'json',
            id: taxonInput,
          },
        });

        const taxon = response.data?.result?.[taxonInput];
        if (taxon?.scientificname) {
          onSelect(taxon.scientificname);
        } else {
          onSelect(taxonInput);
        }
      } catch (err) {
        console.error(err);
        onSelect(taxonInput); 
      }
    } else {
      onSelect(taxonInput); 
    }
    onClose();
  }

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Taxon</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="modalInput">
            <Form.Text>
              Please specify NCBI taxon 
            </Form.Text>

            <a
              href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi"
              target="_blank"
              title="Go to NCBI site"
              className="taxon-modal-link-icon"
            >
              <FiExternalLink />
            </a>
            <Form.Text>
              , preferably by ID (enter blank string to clear out)
            </Form.Text>
    
            <Form.Control
              type="text"
              value={taxonInput}
              onChange={handleModalInputChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleValidate}>
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default TaxonModal;