import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Modal, FormCheck, FormSelect, Form } from "react-bootstrap";
import ProgressDialog from "./ProgressDialog";
import MultiSelectDropdown from "./MultiSelect";
import config from "../config/config";
import endpoints from "../endpoints";
import { useApi, useAuth } from "../contexts/Authentication.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import "../styles/export-panel.scss";
import { GroupFilter, VariantFilter } from "../contexts/Filters.tsx";
interface ExportPanelProps {
  project: string;
  assembly: string;
  groupFilters: any;
  variantFilters: any;
  exportFormats: any;
  show: boolean;
  onClose: () => void;
  referencesOptions: any[];
  buildSearchQuery: (variantFilters:VariantFilter,groupFilters:Record<string, GroupFilter>, usedPagination:boolean) => Record<string, any>;
  metadata?: Array<Object>;
  galaxyURL?: string;
  onOpenToolConfig?: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  project,
  assembly,
  groupFilters,
  variantFilters,
  exportFormats,
  show,
  onClose,
  referencesOptions,
  buildSearchQuery,
  metadata=[],
  galaxyURL = "",
  onOpenToolConfig,
}) => {
  const api = useApi();
  const { token } = useAuth();

  const [onlineOutputTools, setOnlineOutputTools] = useState({});
  const [isSendingToGalaxy, setIsSendingToGalaxy] = useState(false);
  const [showFormatDesc, setShowFormatDesc] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState("");
  const [selectedExportedIndividuals, setSelectedExportedIndividuals] = useState("");
  const [selectedMetadataFields, setSelectedMetadataFields] = useState<string[]>([]);
  const [keepExportOnServer, setKeepExportOnServer] = useState(false);
  const [enableExportPush, setEnableExportPush] = useState(false);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [exportIncludedMetadata, setExportIncludedMetadata] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);

  useEffect(() => {
    const keys = Object.keys(exportFormats || {});
    if (keys.length > 0 && !selectedExportFormat) {
      setSelectedExportFormat(keys[0]);
    }
  }, [exportFormats, selectedExportFormat]);

  // Keep the default individuals selection in sync with the group structure,
  // but don't override an explicit user choice when the groups haven't changed.
  const groupKeys = Object.keys(groupFilters);
  useEffect(() => {
    setSelectedExportedIndividuals(prev => {
      const validValues = new Set(["", "allGroups", ...groupKeys]);
      if (validValues.has(prev)) return prev;  // still valid, keep it
      // Previous choice is no longer valid (e.g. group was deleted), reset to default
      return groupKeys.length > 1 ? "allGroups" : groupKeys.length === 1 ? groupKeys[0] : "";
    });
  }, [groupKeys.join(",")]);

  const buildExportQuery = () => {
    const query = {
      ...buildSearchQuery(variantFilters,groupFilters, null /* We do not use parameter usedPagination*/),
      exportFormat: selectedExportFormat,
      keepExportOnServer: keepExportOnServer,
      metadataFields: selectedMetadataFields,
    };
    
    switch(selectedExportedIndividuals) {
      case "allGroups": {
        // Union of all groups' selected individuals
        const allIndividuals = new Set<string>();
        Object.values(groupFilters).forEach((group: any) => {
          (group.selectedIndividuals || []).forEach((ind: string) => {
            allIndividuals.add(ind);
          });
        });
        query.exportedIndividuals = Array.from(allIndividuals);
        break;
      }
      case "":  // "All of them" - empty means all individuals in database
        query.exportedIndividuals = [];
        break;
      default: {  // Specific group
        const groupId = selectedExportedIndividuals;
        const group = groupFilters[groupId];
        if (group) {
          query.exportedIndividuals = group.selectedIndividuals || [];
        } else {
          query.exportedIndividuals = [];
        }
        break;
      }
    }
    return query;
  };

  const launchExport = async () => {
    try {
      const directDownload = !keepExportOnServer && !enableExportPush;
      const query = buildExportQuery();

      onClose();
      setShowExportProgress(true);

      // 1. Start export process (POST), get a process token/id
      const exportResponse = await api.post(
        `${endpoints.EXPORT_URL}`,
        query,
        {
          headers: { 
            "Content-Type": "application/json",
            accept: "text/plain",
            assembly: assembly?.split("§")[2],
          },
        },
      );
      const exportUrl = exportResponse.data;

      // 2. Poll for progress until complete/aborted
      let isComplete = false;
      let isAborted = false;
      let progressObj = null;
      while (!isComplete && !isAborted) {
        await new Promise(res => setTimeout(res, 2000));
        const progressResp = await fetch(`${endpoints.PROGRESS_URL}?progressToken=export_${token}`);
        if (progressResp.ok) {
          const json = await progressResp.json();
          progressObj = Array.isArray(json) ? json[json.length - 1] : json;
          isComplete = progressObj.complete;
          isAborted = progressObj.aborted;
        } else {
          break;
        }
      }

      setShowExportProgress(false);

      // 3. Only now handle the exportUrl
      if (isComplete && !isAborted) {
        const fullUrl = config.INSTANCE_URL.substring(0, config.INSTANCE_URL.lastIndexOf("/")) + exportUrl;
        if (directDownload) {
          const link = document.createElement("a");
          link.href = fullUrl;
          link.target = "_blank";
          link.download = "";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Fetch online output tools fresh before showing the result modal
          try {
            const toolsResp = await api.get(`${endpoints.ONLINE_OUTPUT_TOOLS}`, {
              headers: { "Content-Type": "application/json", accept: "application/json" },
            });
            setOnlineOutputTools(toolsResp.data || {});
          } catch (e) {
            console.warn("Could not fetch online output tools:", e);
          }
          setExportIncludedMetadata((query.metadataFields?.length ?? 0) > 0);
          setExportDownloadUrl(fullUrl);
        }
      }
    } catch (error) {
      setShowExportProgress(false);
      console.error("Error launching export:", error);
      return;
    }
  };

  const buildExportFileUrls = (): string[] => {
    if (!exportDownloadUrl) return [];
    const formatDetails: any = (exportFormats as any)[selectedExportFormat];
    const extensions: string[] = (formatDetails?.dataFileExtensions as string | undefined)
      ?.split(';').map((e: string) => e.trim()).filter(Boolean) ?? [];
    const urls = extensions.map(ext => exportDownloadUrl.replace(/\.[^.]*$/, '.' + ext));
    const metadataFormatsWithOwnFile = ['FLAPJACK', 'DARWIN'];
    if (exportIncludedMetadata && !metadataFormatsWithOwnFile.includes(selectedExportFormat.toUpperCase()))
      urls.push(exportDownloadUrl.replace(/\.[^.]*$/, '.tsv'));
    return urls;
  };

  const handleSendToGalaxy = async () => {
    const instanceUrl = galaxyURL.trim();
    if (!instanceUrl.startsWith("http")) return;
    const fileUrls = buildExportFileUrls();
    if (fileUrls.length === 0) return;

    let apiKey = localStorage.getItem("galaxyApiKey::" + instanceUrl);
    if (!apiKey)
      apiKey = prompt("Enter the API key tied to your account on\n" + instanceUrl);
    if (!apiKey?.trim()) return;

    localStorage.setItem("galaxyApiKey::" + instanceUrl, apiKey);
    setIsSendingToGalaxy(true);
    let pushed = 0;
    let lastMsg: string | null = null;
    try {
      for (const fileUrl of fileUrls) {
        const resp = await axios.get<string>(
          `${endpoints.GALAXY_HISTORY_PUSH_URL}?galaxyUrl=${encodeURIComponent(instanceUrl)}&galaxyApiKey=${encodeURIComponent(apiKey)}&fileUrl=${encodeURIComponent(fileUrl)}`
        );
        lastMsg = resp.data;
        pushed++;
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        localStorage.removeItem("galaxyApiKey::" + instanceUrl);
        alert("Invalid Galaxy API key — it has been cleared. Please try again.");
      } else {
        alert("Error pushing to Galaxy.");
      }
      setIsSendingToGalaxy(false);
      return;
    }
    setIsSendingToGalaxy(false);
    if (pushed > 0 && confirm(`${pushed} file(s) ${lastMsg}\nOpen a window pointing to that Galaxy instance?`))
      window.open(instanceUrl);
  };

  const buildToolUrl = (toolName: string): string | null => {
    const toolConfig: any = (onlineOutputTools as any)[toolName];
    if (!toolConfig?.url?.trim() || !exportDownloadUrl) return null;

    // Build archivedDataFiles: { extension -> absoluteUrl }
    // Extensions come from the 'dataFileExtensions' field (semicolon-separated) in exportFormats.
    const formatDetails: any = (exportFormats as any)[selectedExportFormat];
    const extensions: string[] = (formatDetails?.dataFileExtensions as string | undefined)
      ?.split(';').map((e: string) => e.trim()).filter(Boolean)
      ?? [];

    const archivedDataFiles: Record<string, string> = {};
    for (const ext of extensions) {
      archivedDataFiles[ext] = exportDownloadUrl.replace(/\.[^.]*$/, '.' + ext);
    }
    // When metadata was exported and the format doesn't have its own metadata file,
    // a .tsv metadata file is also present in the archive.
    const metadataFormatsWithOwnFile = ['FLAPJACK', 'DARWIN'];
    if (exportIncludedMetadata && !metadataFormatsWithOwnFile.includes(selectedExportFormat.toUpperCase())) {
      archivedDataFiles['tsv'] = exportDownloadUrl.replace(/\.[^.]*$/, '.tsv');
    }

    let url: string = toolConfig.url;
    const matches = url.match(/\{([^}]+)\}/g);
    if (matches) {
      let anyMatched = false;
      for (const token of matches) {
        const ph = token.slice(1, -1);               // strip { }
        const phExts = ph.split('|');
        const matchedExt = phExts.find(e => archivedDataFiles[e]);
        if (matchedExt) {
          url = url.replace(token, archivedDataFiles[matchedExt]);
          anyMatched = true;
        } else {
          url = url.replace(token, '');              // strip unused placeholder
        }
      }
      if (!anyMatched) return null;
    } else if (url.includes('*')) {
      url = url.replace('*', Object.values(archivedDataFiles).join(','));
    }

    return url;
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        centered
        className="export-panel-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Export setup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="export-panel-section export-panel-format-row">
            <Form.Group className="export-panel-field export-panel-field-format">
              <Form.Label htmlFor="exportFormat">Export format</Form.Label>
              <FormSelect
                id="exportFormat"
                value={selectedExportFormat}
                onChange={e => setSelectedExportFormat(e.target.value)}
              >
                {Object.entries(exportFormats).map(([name, details]) => (
                  <option key={name} value={name} data-desc={details.desc}>{name}</option>
                ))}
              </FormSelect>
            </Form.Group>
            <span
              title="Click to display information on selected format"
              className={`export-panel-info-trigger${showFormatDesc ? " export-panel-info-trigger-disabled" : ""}`}
              onClick={() => { if (!showFormatDesc) setShowFormatDesc(true); }}
            >
              <span role="img" aria-label="info" className="export-panel-info-icon" > ℹ️ </span>
            </span>
          </div>

          <div className="export-panel-section export-panel-columns">
            <Form.Group className="export-panel-field">
              <Form.Label htmlFor="exportedIndividuals">Exported individuals</Form.Label>
              <FormSelect
                id="exportedIndividuals"
                value={selectedExportedIndividuals}
                onChange={e => setSelectedExportedIndividuals(e.target.value)}
              >
                {Object.keys(groupFilters).length > 1 && <option value="allGroups">All groups</option>}
                {Object.keys(groupFilters).map((groupId) => (
                  <option key={groupId} value={groupId}>{`Group ${groupId}`}</option>
                ))}
                <option value="">All of them</option>
              </FormSelect>
            </Form.Group>

            <Form.Group className="export-panel-field export-panel-field-metadata" hidden={metadata.length === 0}>
              <MultiSelectDropdown
                title="Exported metadata"
                options={metadata.map(mdField => String(mdField))}
                selectedOptions={selectedMetadataFields}
                setSelectedOptions={setSelectedMetadataFields}
                enableLookup={metadata.length > 4}
                isLookup
              />
            </Form.Group>
          </div>

          <div className="export-panel-section export-panel-options">
            <div className="export-panel-option" title="If ticked, exported data will be provided by URL, and available for pushing into external online tools.">
              <FormCheck id="enableExportPush" checked={enableExportPush || keepExportOnServer} disabled={keepExportOnServer} onChange={e => setEnableExportPush(e.target.checked)} className="export-panel-option-check" />
              <label htmlFor="enableExportPush" className="export-panel-option-label">Provide export URL</label>
            </div>
            <div className="export-panel-option" title="If ticked, export data will remain downloadable for at least 48h. You may then share its URL with collaborators.">
              <FormCheck id="keepExportOnServ" checked={keepExportOnServer} onChange={e => setKeepExportOnServer(e.target.checked)} className="export-panel-option-check" />
              <label htmlFor="keepExportOnServ" className="export-panel-option-label">Keep files on server</label>
            </div>
          </div>

          <div id="serverExportWarning" className="export-panel-server-warning"></div>
        </Modal.Body>
        <Modal.Footer>
          <Button id="export-btn" onClick={() => { launchExport(); }}>Export</Button>
        </Modal.Footer>
      </Modal>

      {/* Help message at the top */}
      {showFormatDesc && (
        <div className="export-panel-help-banner">
          <div className="export-panel-help-banner-inner">
            <span role="img" aria-label="info" className="export-panel-help-banner-icon">ℹ️</span>
            <span dangerouslySetInnerHTML={{
              __html: exportFormats[selectedExportFormat]?.desc || "No description available."
            }} />
            <Button
              variant="outline-secondary"
              size="sm"
              className="export-panel-help-close"
              onClick={() => setShowFormatDesc(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {exportDownloadUrl && (
        <Modal
          show={!!exportDownloadUrl}
          onHide={() => setExportDownloadUrl(null)}
          centered
          className="export-panel-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>Export ready</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="export-panel-ready-summary">
              <strong>
                Export file will be available at this URL for {keepExportOnServer ? 48 : 1}h:
              </strong>
              <div className="export-panel-url-block">
                <a href={exportDownloadUrl || "#"} target="_blank" rel="noopener noreferrer">
                  {exportDownloadUrl ? exportDownloadUrl.substring(exportDownloadUrl.lastIndexOf("/") + 1) : ""}
                </a>
              </div>
            </div>
            <div className="export-panel-center-text">
              You can now share this URL with your collaborators, or use it in <a onClick={onOpenToolConfig} className="export-panel-inline-link">external online tools <FontAwesomeIcon icon={faScrewdriverWrench} size="sm" /></a>.
              <div className="export-panel-ready-actions">
                {galaxyURL?.startsWith("http") && (
                  <Button size="sm" disabled={isSendingToGalaxy} onClick={handleSendToGalaxy}>
                    {isSendingToGalaxy ? "Sending…" : `Send exported data to ${galaxyURL}`}
                  </Button>
                )}
                {Object.entries(onlineOutputTools).map(([name, details]: [string, any]) => {
                  if (!details.formats?.split(",").map((f: string) => f.trim()).includes(selectedExportFormat)) return null;
                  const toolUrl = buildToolUrl(name);
                  if (!toolUrl) return null;
                  return (
                    <Button key={name} size="sm" onClick={() => window.open(toolUrl, '_blank')}>
                      Send files to {name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <ProgressDialog
        progressToken={`export_${token}`}
        show={showExportProgress}
        onHide={() => setShowExportProgress(false)}
        title="Export in progress"
        showAbort={true}
        onAbort={() => {}}
        nbMin={2}
      />
    </>
  );
};

export default ExportPanel;