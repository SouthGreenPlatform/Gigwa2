import { useEffect, useState } from "react";
import { useApi } from "../contexts/Authentication.tsx";
import endpoints from "../endpoints";
import { Link } from "react-router-dom";
import "../styles/instance-content.scss";

function InstanceContent() {
  const api = useApi();
  const [instanceContent, setInstanceContent] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instance = await api.get(`${endpoints.INSTANCE_CONTENTS_URL}`, {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
        });
        setInstanceContent(instance.data);
      } catch (error: any) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const databases = Object.keys(instanceContent);

  // Totals for the summary strip
  const totalVariants = databases.reduce(
    (sum, key) => sum + (Number(instanceContent[key]?.markers) || 0),
    0
  );
  const totalIndividuals = databases.reduce(
    (sum, key) => sum + (Number(instanceContent[key]?.individuals) || 0),
    0
  );
  const totalProjects = databases.reduce(
    (sum, key) =>
      sum +
      Object.keys(instanceContent[key] || {}).filter((k) =>
        k.startsWith("Project")
      ).length,
    0
  );

  return (
    <div className="ic-page">
      {/* ── Header ──────────────────────────── */}
      <div className="ic-header">
        <h1 className="ic-title">Instance Contents</h1>
        <p className="ic-subtitle">
          Overview of all databases, projects, and datasets available on this Gigwa instance.
        </p>
      </div>

      {/* ── Summary Strip ───────────────────── */}
      <div className="ic-summary-strip">
        <div className="ic-stat">
          <span className="ic-stat-value">{databases.length}</span>
          <span className="ic-stat-label">{databases.length === 1 ? "Database" : "Databases"}</span>
        </div>
        <div className="ic-stat">
          <span className="ic-stat-value">{totalProjects}</span>
          <span className="ic-stat-label">{totalProjects === 1 ? "Project" : "Projects"}</span>
        </div>
        <div className="ic-stat">
          <span className="ic-stat-value">{totalVariants.toLocaleString()}</span>
          <span className="ic-stat-label">Variants</span>
        </div>
        <div className="ic-stat">
          <span className="ic-stat-value">{totalIndividuals.toLocaleString()}</span>
          <span className="ic-stat-label">Individuals</span>
        </div>
      </div>

      {/* ── Database Cards ──────────────────── */}
      {databases.length === 0 ? (
        <div className="ic-empty">No databases found on this instance.</div>
      ) : (
        <div className="ic-grid">
          {databases.map((databaseKey) => {
            const db = instanceContent[databaseKey];
            const projectKeys = Object.keys(db).filter((k) =>
              k.startsWith("Project")
            );

            return (
              <div className="ic-card" key={databaseKey}>
                {/* Card Header */}
                <div className="ic-card-header">
                  <Link
                    to={`/investigate/Any%20taxon/${db.database}/`}
                    className="ic-card-name"
                  >
                    {db.database}
                  </Link>
                  {db.taxon && (
                    <span className="ic-card-taxon">{db.taxon}</span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="ic-card-stats">
                  <div className="ic-card-stat">
                    <span className="ic-card-stat-value">
                      {Number(db.markers || 0).toLocaleString()}
                    </span>
                    <span className="ic-card-stat-label">Variants</span>
                  </div>
                  <div className="ic-card-stat">
                    <span className="ic-card-stat-value">
                      {Number(db.individuals || 0).toLocaleString()}
                    </span>
                    <span className="ic-card-stat-label">Individuals</span>
                  </div>
                  <div className="ic-card-stat">
                    <span className="ic-card-stat-value">
                      {projectKeys.length}
                    </span>
                    <span className="ic-card-stat-label">
                      {projectKeys.length === 1 ? "Project" : "Projects"}
                    </span>
                  </div>
                </div>

                {/* Projects */}
                {projectKeys.length > 0 && (
                  <div className="ic-card-projects-wrapper">
                    <div className="ic-card-projects">
                      <div className="ic-card-projects-title">Projects</div>
                      {projectKeys.map((projectKey) => {
                        const proj = db[projectKey];
                        return (
                          <div className="ic-project" key={projectKey}>
                            <div className="ic-project-name">{proj.name}</div>
                            <div className="ic-project-details">
                              <span className="ic-project-tag">{proj.variantType}</span>
                              <span className="ic-project-tag">Ploidy: {proj.ploidy}</span>
                              <span className="ic-project-tag">
                                {proj.samples} {Number(proj.samples) === 1 ? "sample" : "samples"}
                              </span>
                              <span className="ic-project-tag">
                                {proj.runs} {Number(proj.runs) === 1 ? "run" : "runs"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {projectKeys.length > 3 && (
                      <div className="ic-card-projects-more">
                        ↓ Scroll for {projectKeys.length - 3} more {projectKeys.length - 3 === 1 ? "project" : "projects"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InstanceContent;
