import React from "react";
import { Modal, Spinner } from "react-bootstrap";
import "../styles/project-info-modal.scss";

interface ProjectMetadataEntry {
  key: string;
  value: string;
}

interface ProjectInfo {
  id: string;
  name?: string;
  metadata?: ProjectMetadataEntry[];
}

interface ProjectInfoModalProps {
  show: boolean;
  onClose: () => void;
  projects: ProjectInfo[];
  loading?: boolean;
  dbDescription?: string;
  runCount?: number;
  runCountsByProject?: Record<string, number>;
}

const TECHNICAL_METADATA_KEYS = ["genotyping technology", "ploidy"];

const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  show,
  onClose,
  projects,
  loading = false,
  dbDescription,
  runCount,
  runCountsByProject = {},
}) => {
  return (
    <Modal show={show} onHide={onClose} centered scrollable className="project-info-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          Project information{projects.length > 1 ? ` (${projects.length} projects)` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="project-info-loading">
            <Spinner animation="border" size="sm" />
            <span>Loading project information…</span>
          </div>
        )}

        {!loading && dbDescription && (
          <div className="project-info-summary">
            <span className="project-info-summary-icon" role="img" aria-label="database">🗄️</span>
            <span className="project-info-summary-text">{dbDescription}</span>
          </div>
        )}

        {!loading && runCount != null && (
          <div className="project-info-run-count">
            This selection contains <span className="project-info-run-badge">{runCount}</span> run{runCount === 1 ? "" : "s"} of data.
          </div>
        )}

        {!loading && projects.length === 0 && (
          <p className="project-info-empty">No project selected.</p>
        )}

        {!loading && projects.map((project) => {
          const metadata = project.metadata || [];
          const technicalEntries = metadata.filter((m) => TECHNICAL_METADATA_KEYS.includes(m.key));
          const description = metadata
            .filter((m) => m.key === "description")
            .map((m) => m.value)
            .join("\n\n");
          const projectRunCount = runCountsByProject[project.id];
          const hasTags = projectRunCount != null || technicalEntries.length > 0;

          return (
            <section key={project.id} className="project-info-section">
              <div className="project-info-eyebrow">Project</div>
              <h3 className="project-info-title">{project.name || project.id}</h3>

              {hasTags && (
                <div className="project-info-tags">
                  {projectRunCount != null && (
                    <span className="project-info-tag">
                      <span className="project-info-tag-key">Runs</span>
                      <span className="project-info-tag-value">{projectRunCount}</span>
                    </span>
                  )}
                  {technicalEntries.map((entry, idx) => (
                    <span className="project-info-tag" key={`${entry.key}-${idx}`}>
                      <span className="project-info-tag-key">{entry.key}</span>
                      <span className="project-info-tag-value">{entry.value}</span>
                    </span>
                  ))}
                </div>
              )}

              {description ? (
                <pre className="project-info-description">{description}</pre>
              ) : (
                !hasTags && (
                  <p className="project-info-empty">No additional information available for this project.</p>
                )
              )}
            </section>
          );
        })}
      </Modal.Body>
    </Modal>
  );
};

export default ProjectInfoModal;
