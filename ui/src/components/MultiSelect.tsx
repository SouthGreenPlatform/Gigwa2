import React, { useEffect, useRef, useState } from "react";
import { Dropdown, Button, Form } from "react-bootstrap";
import { FixedSizeList as List } from "react-window";
import "../styles/multi-select.scss";
function MultiSelectDropdown({
  myColor = "",
  contrastColor="",
  options = [] as string[],
  enableLookup = false,
  selectedOptions = [] as string[],
  setSelectedOptions,
  groupID = "",
  isLookup=false,
  title="",
  toggleClassName="",
  onClose = undefined as (() => void) | undefined,
  keepOpenOnSelect = false
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggleOption = (option) => {
    let newSelected;
    if (selectedOptions.includes(option)) {
      newSelected = selectedOptions.filter((item) => item !== option);
    } else {
      newSelected = [...selectedOptions, option];
    }

    if (groupID !== "") {
      setSelectedOptions(groupID, newSelected);
    } else {
      setSelectedOptions(newSelected);
    }
  };

  const handleMouseDown = (option) => {
    setIsMouseDown(true);
    toggleOption(option);
  };

  const handleMouseEnter = (option) => {
    if (isMouseDown) {
      toggleOption(option);
    }
  };

  const selectAll = () => {
    const all = [...options];
    if (groupID !== "") {
      setSelectedOptions(groupID, all);
    } else {
      setSelectedOptions(all);
    }
  };

  const deselectAll = () => {
    if (groupID !== "") {
      setSelectedOptions(groupID, []);
    } else {
      setSelectedOptions([]);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const filteredOptions =
    enableLookup && searchTerm.length >= 3
      ? options.filter((option) =>
          option.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;
    

// Add this inside your component above return:
const Row = ({ index, style, data }) => {
  const option = data.options[index];
  const { selectedOptions, handleMouseDown, handleMouseEnter, keepOpenOnSelect } = data;
  const rowStyle = style;

  const handleRowMouseDown = (e) => {
    if (keepOpenOnSelect) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleMouseDown(option);
  };

  const handleRowMouseEnter = (e) => {
    if (keepOpenOnSelect && e.buttons === 1) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleMouseEnter(option);
  };

  return (
    <div
      onMouseDown={handleRowMouseDown}
      onMouseEnter={handleRowMouseEnter}
      className={selectedOptions.includes(option) ? "dropdown-item selected" : "dropdown-item"}
      style={rowStyle}
          data-multiselect-row="true"
    >
      <span className="text">{option}</span>
      {selectedOptions.includes(option) && (
            <span className="glyphicon glyphicon-ok check-mark multiselect-checkmark">✔</span>
      )}
    </div>
  );
};

  return (
    <div
        className="btn-group bootstrap-select show-tick multiselect-full-width"
    >
      <Dropdown
          className="multiselect-full-width"
        show={keepOpenOnSelect ? isOpen : undefined}
        autoClose={onClose || keepOpenOnSelect ? "outside" : true}
        onToggle={(open, meta: any) => {
          if (keepOpenOnSelect && !open) {
            const source = meta?.source;
            const eventTarget = meta?.originalEvent?.target as Node | undefined;
            const isMenuClick = !!(eventTarget && menuRef.current?.contains(eventTarget));
            if (source === "select" || (source === "click" && isMenuClick)) {
              return;
            }
          }
          if (keepOpenOnSelect) {
            setIsOpen(open);
          }
          if (!open) onClose?.();
        }}
      >
        {(() => {
          const toggleStyle = { backgroundColor: myColor, color: contrastColor };
          return (
        <Dropdown.Toggle
          variant="default"
          className={`btn dropdown-toggle d-flex align-items-center${toggleClassName ? ` ${toggleClassName}` : ""}`}
          style={toggleStyle}
          data-multiselect-toggle="true"
        >
          {title && <strong className="multiselect-title">{title}:</strong>}
          <span className="filter-option">
            {selectedOptions.length > 0
              ? `${selectedOptions.length}/${options.length}`
              : !isLookup? `${options.length}/${options.length}`:`0/${options.length}`}
          </span>
        </Dropdown.Toggle>
          );
        })()}

        <Dropdown.Menu
        ref={menuRef}
        align="end"
          className="multiselect-menu"
          popperConfig={{ modifiers: [{ name: "offset", options: { offset: [0, 0] } }] }}
        >
          <div className="bs-actionsbox multiselect-actionsbox"
          >
            <div className="multiselect-actions-row">
              <div className="multiselect-actions-buttons">
                <Button
                  variant="default"
                  className="actions-btn bs-select-all"
                  onMouseDown={(e) => {
                    if (keepOpenOnSelect) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => {
                    if (keepOpenOnSelect) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    selectAll();
                  }}
                >
                  All
                </Button>
                <Button
                  variant="default"
                  className="actions-btn bs-deselect-all"
                  onMouseDown={(e) => {
                    if (keepOpenOnSelect) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => {
                    if (keepOpenOnSelect) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    deselectAll();
                  }}
                >
                  None
                </Button>
              </div>
              {enableLookup && (
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onMouseDown={(e) => {
                    if (keepOpenOnSelect) {
                      e.stopPropagation();
                    }
                  }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="multiselect-search-input"
                />
              )}
            </div>
          </div>

{filteredOptions.length > 0 ? (
  <List
    height={200}
    itemCount={filteredOptions.length}
    itemSize={35} // height of each option
    itemData={{
      options: filteredOptions,
      selectedOptions,
      handleMouseDown,
      handleMouseEnter,
      keepOpenOnSelect,
    }}
  >
    {Row}
  </List>
) : (
  <div className="text-muted text-center multiselect-empty-state">
    No options found
  </div>
)}

        </Dropdown.Menu>
      </Dropdown>

      {/* Hidden input to integrate with forms */}
      <Form.Control
        as="select"
        multiple
        className="selectpicker multiselect-hidden-select"
        value={selectedOptions}
        onChange={() => {}}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Form.Control>
    </div>
  );
}

export default MultiSelectDropdown;
