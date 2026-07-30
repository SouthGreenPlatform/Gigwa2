import React, { useEffect, useState, useCallback, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import MultiSelectDropdown from "./MultiSelect";
import { useParams } from "react-router-dom";
import { useApi } from "../contexts/Authentication";
import endpoints from "../endpoints";
import { useFilters } from "../contexts/Filters";
import { FixedSizeList as List } from "react-window";
import "../styles/metadata-modal.scss";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableColumn = ({ id, children, width }) => {
  const { setNodeRef, transform, transition, attributes, listeners } = useSortable({ id });
  const sortableStyle = {
    width,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className="metadata-sortable-column"
    >
      <div {...attributes} {...listeners} className="metadata-sortable-column-handle">
        <b>{id}</b>
      </div>
      <div>{children}</div>
    </div>
  );
};

const MetadataModal = ({ show, onClose, individuals, distinctMetadata, groupID, workWithSamples }) => {
  const [currentMetadata, setCurrentMetadata] = useState([]);
  const { setSelectedIndividuals } = useFilters();
  const { dbOrProjects, assembly } = useParams();
  const database = dbOrProjects?.includes('§') ? dbOrProjects.split(',')[0].split('§')[0] : (dbOrProjects || "");
  const project = dbOrProjects?.includes('§') ? dbOrProjects : undefined;
  const api = useApi();

  const storageKey = `metadata_columns_order_${database}`;

  const MAX_COLUMNS = 10;
  const allColumns = Object.keys(distinctMetadata);

  // ✅ load persisted order
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.filter((col) => allColumns.includes(col)).slice(0, MAX_COLUMNS);
    }
    return allColumns.slice(0, MAX_COLUMNS);
  });

  const updateVisibleColumns = (newSelection) => {
    if (newSelection.length <= MAX_COLUMNS) {
      setVisibleColumns(newSelection);
      localStorage.setItem(storageKey, JSON.stringify(newSelection));
    }
  };

  const buildSelectedOptionsState = (distinctMetadata, workWithSamples) => {
    if (!workWithSamples) {
      return Object.fromEntries(Object.keys(distinctMetadata).map((key) => [key, []]));
    }

    const individual = {};
    const sample = {};

    Object.keys(distinctMetadata).forEach((key) => {
      if (key.startsWith("ind.")) {
        individual[key.replace(/^ind\./, "")] = [];
      } else {
        sample[key] = [];
      }
    });

    return { individual, sample };
  };

  const [selectedOptionsByColumn, setSelectedOptionsByColumn] = useState(() =>
    buildSelectedOptionsState(distinctMetadata, workWithSamples)
  );
  const [pendingSelectedOptionsByColumn, setPendingSelectedOptionsByColumn] = useState(() =>
    buildSelectedOptionsState(distinctMetadata, workWithSamples)
  );

  useEffect(() => {
    const initialState = buildSelectedOptionsState(distinctMetadata, workWithSamples);
    setSelectedOptionsByColumn(initialState);
    setPendingSelectedOptionsByColumn(initialState);
  }, [distinctMetadata, workWithSamples]);

  const fetchMetadata = async (workWithSamples) => {
    try {
      const metadataEndpoint = workWithSamples
        ? endpoints.DATABASE_SAMPLE_METADATA_URL
        : endpoints.DATABASE_METADATA_URL;

      const Metadata = await api.post(
        `${metadataEndpoint}/${database}?projIDs=${project?.split(",").map(item => item.split("§")[1]).join(",")}`,
        selectedOptionsByColumn,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            assembly: assembly?.split("§")[1],
          },
        }
      );
      setCurrentMetadata(Metadata.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchMetadata(workWithSamples);
  }, [selectedOptionsByColumn]);

  const columns = visibleColumns;

  const containerRef = useRef(null);
  const [totalWidth, setTotalWidth] = useState(0);
  const [listHeight, setListHeight] = useState(400);
  const rowHeight = 40;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setListHeight(containerRef.current.offsetHeight - 60);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [show]);

  useEffect(() => {
    if (containerRef.current) {
      setTotalWidth(containerRef.current.offsetWidth);
    }
  }, [show]);

  const columnWidths = { Individuals: 150, Actions: 100 };
  const totalFixedWidth = columnWidths.Individuals + columnWidths.Actions;
  const dynamicColWidth =
    columns.length > 0 ? (totalWidth - totalFixedWidth) / columns.length : 0;

  const updateColumnSelection = (column, newSelection) => {
    setPendingSelectedOptionsByColumn((prev) => {
      if (!workWithSamples) {
        return { ...prev, [column]: newSelection };
      }

      if (column.startsWith("ind.")) {
        const clean = column.replace(/^ind\./, "");
        return {
          ...prev,
          individual: { ...prev.individual, [clean]: newSelection },
        };
      }

      return {
        ...prev,
        sample: { ...prev.sample, [column]: newSelection },
      };
    });
  };

  const getColumnSelection = (selectionState, column) => {
    if (!workWithSamples) {
      return selectionState?.[column] || [];
    }

    if (column.startsWith("ind.")) {
      const clean = column.replace(/^ind\./, "");
      return selectionState?.individual?.[clean] || [];
    }

    return selectionState?.sample?.[column] || [];
  };

  const applyPendingColumnSelection = () => {
    setSelectedOptionsByColumn((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(pendingSelectedOptionsByColumn)) {
        return prev;
      }
      return pendingSelectedOptionsByColumn;
    });
  };

  const resetSelectedOptions = () => {
    const resetState = buildSelectedOptionsState(distinctMetadata, workWithSamples);
    setSelectedOptionsByColumn(resetState);
    setPendingSelectedOptionsByColumn(resetState);
  };

  const updateGroupIndividualSelection = () => {
    setSelectedIndividuals(groupID, currentMetadata.map((m) => m.id));
    onClose();
  };

  // ✅ DnD logic
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setVisibleColumns((prev) => {
      const newOrder = arrayMove(
        prev,
        prev.indexOf(active.id),
        prev.indexOf(over.id)
      );
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
      return newOrder;
    });
  };
  const Row = useCallback(
    ({ index, style }) => {
      const individual = currentMetadata[index];
      const additionalInfo = individual?.additionalInfo || {};

      return (
        <div style={style} className="metadata-row">
          <div className="metadata-cell metadata-col-individuals">
            {individual?.id}
          </div>

          {columns.map((col) => {
            const metadataCellStyle = { width: dynamicColWidth };
            return (
              <div key={col} style={metadataCellStyle} className="metadata-cell">
                {additionalInfo[col] || "N/A"}
              </div>
            );
          })}

          <div className="metadata-actions-cell metadata-col-actions">
            <button onClick={() =>
              setCurrentMetadata(prev => prev.filter(i => i.id !== individual.id))
            }>
              X
            </button>
          </div>
        </div>
      );
    },
    [currentMetadata, columns, dynamicColWidth]
  );

  return (
    <Modal show={show} onHide={onClose} fullscreen centered>
<Modal.Header closeButton className="metadata-modal-header">
  <div className="metadata-header-left">
    <Modal.Title>Metadata Table</Modal.Title>
    <Button onClick={resetSelectedOptions}>Reset</Button>

  </div>

   <div className="metadata-header-columns-picker">
    <MultiSelectDropdown
      title="Columns"
      options={allColumns}
      selectedOptions={visibleColumns}
      setSelectedOptions={updateVisibleColumns}
      enableLookup
    />
</div>

    <div className="metadata-header-summary-pill">
      Click Apply to set group {groupID} to currently selected {currentMetadata.length} {currentMetadata.length === 1 ? "biological entity" : "biological entities"}
    </div>
  <div className="metadata-header-actions">
    <Button onClick={updateGroupIndividualSelection}>Apply</Button>
      </div>
    


</Modal.Header>

      <Modal.Body className="metadata-modal-body">
        <div ref={containerRef} className="metadata-modal-body-content">

          {/* HEADER WITH DND */}
          <div className="metadata-grid-header">
            <div className="metadata-grid-header-cell metadata-col-individuals">
              {workWithSamples ? "Samples" : "Individuals"}
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} >
          <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
            {columns.map((col) => (
              <SortableColumn
                key={col}
                id={col}
                width={dynamicColWidth} // same width as body cells
              >
                <MultiSelectDropdown
                  options={distinctMetadata[col]}
                  selectedOptions={getColumnSelection(pendingSelectedOptionsByColumn, col)}
                  setSelectedOptions={(v) => updateColumnSelection(col, v)}
                  keepOpenOnSelect
                  onClose={applyPendingColumnSelection}
                  enableLookup={true}
                />
              </SortableColumn>
            ))}
          </SortableContext>
            </DndContext>

            <div className="metadata-grid-actions-header metadata-col-actions">
              Actions
            </div>
          </div>

          {/* BODY */}
          <List
            height={listHeight}
            itemCount={currentMetadata.length}
            itemSize={rowHeight}
            width={totalWidth}
          >
            {Row}
          </List>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default MetadataModal;