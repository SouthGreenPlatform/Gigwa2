import React, { useState } from "react";
import fillingForm from "../assets/fillingForm.png";

const InputModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [_ids, setIds] = useState<string[]>([]);

  const handleModalToggle = () => {
    setShowModal(!showModal);
  };

  const handleApply = () => {
    setIds(
      inputValue
        .split("\n")
        .map((id) => id.trim())
        .filter((id) => id),
    );
    setShowModal(false);
  };
  return (
    <div>
      {/* Button to open the modal */}
      <img
        src={fillingForm}
        alt="Insert accessions "
        className="icon-small"
        title="Paste filtered list from clipboard"
        onClick={handleModalToggle}
      />
      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show input-modal-visible"
          tabIndex={-1}
        >
          <div className="modal-dialog custom-modal-size">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleModalToggle}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="message-text" className="col-form-label">
                      Please paste up to 1000 gene IDs (one per line) in the box
                      below:
                    </label>
                    <textarea
                      className="form-control"
                      id="message-text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    ></textarea>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalToggle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApply}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputModal;
