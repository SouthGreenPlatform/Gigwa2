import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import Form from 'react-bootstrap/Form';
import { useApi } from "../contexts/Authentication.tsx";
import endpoints from '../endpoints.ts';
import { useMatch, useNavigate, useParams } from "react-router-dom";
import MultiSelectDropdown from "../components/MultiSelect";
import ProjectInfoModal from "../components/ProjectInfoModal";
import { fetchRuns, fetchDatabaseSummary } from "../api/api";
import "../styles/dataset-selection.scss";
import { Col, Row } from 'react-bootstrap';
import "../styles/dataset-selection.scss";

const DatasetSelection = forwardRef((props: { initialTaxon: any; initialDatabase: any; initialProjects: any; initialAssembly: any; }, ref) => {
  const isAnyTaxonValue = (taxonValue: string | undefined | null) => {
    const normalized = (taxonValue ?? "")
      .replace(/[()]/g, "")
      .trim()
      .toLowerCase();
    return normalized === "any taxon";
  };

  // Accept initial values as props (for direct rendering) or from URL params (for routed rendering)
  const match = useMatch("/investigate/:taxon?/:dbOrProjects?/:assembly?");
  const { taxon, dbOrProjects, assembly } = match?.params || {};
  const urlDatabase = dbOrProjects?.includes('§') ? dbOrProjects.split(',')[0].split('§')[0] : (dbOrProjects || "");
  const urlProjects = dbOrProjects?.includes('§') ? dbOrProjects : "";
  const initialTaxon = props.initialTaxon ?? taxon ?? "Any taxon";
  const initialDatabase = props.initialDatabase ?? urlDatabase;
  const initialProjects = props.initialProjects ?? urlProjects;
  const initialAssembly = props.initialAssembly ?? assembly ?? "";

  const [currentTaxon, setCurrentTaxon] = useState(initialTaxon);
  const [referenceSets, setReferenceSets] = useState([]);
  const [currentDatabase, setCurrentDatabase] = useState(initialDatabase);
  const [currentProjects, setCurrentProjects] = useState(initialProjects);
  const [projectsDb, setProjectsDb] = useState<{ id: string; name?: string }[]>([]);
  const [assemblies, setAssemblies] = useState([]);
  const [currentAssembly, setCurrentAssembly] = useState(initialAssembly);
  const [taxons, setTaxons] = useState<string[]>([]);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [dbDescription, setDbDescription] = useState<string | undefined>(undefined);
  const [runCount, setRunCount] = useState<number | undefined>(undefined);
  const [runCountsByProject, setRunCountsByProject] = useState<Record<string, number>>({});
  const [loadingProjectInfo, setLoadingProjectInfo] = useState(false);
  const [instanceContent, setInstanceContent] = useState<Record<string, { taxon: string; database: string }>>({});
  const [instanceContentLoaded, setInstanceContentLoaded] = useState(false);
  const navigate = useNavigate();
  const api = useApi();

  // Guards the one-time check (below) for a database passed via the URL that isn't part of
  // the publicly listed reference sets — e.g. a temporary database just created by an import.
  // Such databases are intentionally hidden from the normal listing (mirrors Gigwa2's own
  // behavior), so it must still be tried directly instead of being wiped out as "not found".
  const initialDatabaseHandledRef = useRef(false);

  // On mount: if the URL already has an assembly, strip it so the panels in Investigate.tsx
  // start hidden and only appear after the normal validation cascade re-confirms it.
  useEffect(() => {
    if (initialAssembly && initialProjects) {
      navigate(`/investigate/${initialTaxon}/${initialProjects}`, { replace: true });
    } else if (initialAssembly && initialDatabase) {
      navigate(`/investigate/${initialTaxon}/${initialDatabase}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    resetToFirstDatabase: () => {
      if (referenceSets.length > 0) {
        const firstDb = referenceSets[0].id;
        setCurrentDatabase(firstDb);
        handleDatabaseChange(firstDb);
      }
    }
  }));

  // Fetch available databases and their taxon info for navbar dropdowns.
  // hasFetchedRef prevents React StrictMode from running this twice per mount.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const fetchData = async () => {
      try {
        const response = await api.post(`${endpoints.GA4GH_SEARCH_REFERENCESETS_URL}`, {
          assemblyId: null, md5checksum: null, accession: null, pageSize: null, pageToken: null,
        }, {
          headers: { 'Content-Type': 'application/json', accept: 'application/json' }
        });
        const sets = response.data.referenceSets ?? [];
        const content: Record<string, { taxon: string; database: string }> = {};
        sets.forEach((rs: any) => {
          let taxon = null;
					rs.description.split(" ; ").forEach(function(descItem: string) {
						if (descItem.startsWith("Species:"))
							taxon = descItem.substring("Species:".length).trim();
						else if (descItem.startsWith("Taxon:"))
							taxon = descItem.substring("Taxon:".length).trim();
					});
          content[rs.id] = { taxon: taxon ?? "(Unspecified taxon)", database: rs.id };
        });
        setInstanceContent(content);
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        setInstanceContentLoaded(true);
      }
    };
    fetchData();
  }, []);

  // Set taxons from instance content
  useEffect(() => {
    const t: Set<string> = new Set();
    Object.keys(instanceContent).forEach((databaseKey) => {
      t.add(instanceContent[databaseKey].taxon);
    });
    const arr = Array.from(t);
    arr.sort((a, b) => a === "(Unspecified taxon)" ? -1 : b === "(Unspecified taxon)" ? 1 : a.localeCompare(b));
    setTaxons(arr);
  }, [instanceContent]);

  // Filter referenceSets based on currentTaxon
  useEffect(() => {
    if (!instanceContentLoaded) return; // wait for the real listing before deciding what's "unlisted"

    const updatedDatabase = [];
    const isAnyTaxon = isAnyTaxonValue(currentTaxon);
    for (const set in instanceContent) {
      if (
        instanceContent[set].taxon === currentTaxon || isAnyTaxon || (instanceContent[set].taxon === "(Unspecified taxon)" && currentTaxon === "Unspecified taxon")
      ) {
        updatedDatabase.push({ id: instanceContent[set].database });
      }
    }

     if (!initialDatabaseHandledRef.current) {
      initialDatabaseHandledRef.current = true;
      if (initialDatabase && !updatedDatabase.some(d => d.id === initialDatabase)) {
        updatedDatabase.push({ id: initialDatabase });
        setReferenceSets(updatedDatabase);
        setCurrentDatabase(initialDatabase);
        handleDatabaseChange(initialDatabase);
        return;
      }
    }

    setReferenceSets(updatedDatabase);

    // Auto-select if only one database, else reset
    if (updatedDatabase.length === 1) {
      setCurrentDatabase(updatedDatabase[0].id);
      handleDatabaseChange(updatedDatabase[0].id);
    } else {
      setCurrentDatabase("");
      setProjectsDb([]);
      setCurrentProjects("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTaxon, instanceContent, instanceContentLoaded]);

  useImperativeHandle(ref, () => ({
    resetToFirstDatabase: () => {
      if (referenceSets.length > 0) {
        const noDb = referenceSets[0].id;
        setCurrentDatabase(noDb);
        handleDatabaseChange(noDb);
      }
    }
  }));

  // When referenceSets are loaded and initialDatabase is present, select it.
  // Skip when there is only 1 database: the [currentTaxon, instanceContent] effect
  // already auto-selected it via handleDatabaseChange.
  useEffect(() => {
    if (
      initialDatabase &&
      referenceSets.length > 1 &&
      referenceSets.some(ref => ref.id === initialDatabase)
    ) {
      setCurrentDatabase(initialDatabase);
      handleDatabaseChange(initialDatabase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDatabase, referenceSets]);

  // When projects are loaded and initialProject is present, select it
  useEffect(() => {
    if (
      initialProjects &&
      projectsDb.length > 0 &&
      projectsDb.some(proj => proj.id === initialProjects)
    ) {
      setCurrentProjects(initialProjects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjects, projectsDb]);

  // When assemblies are loaded and initialAssembly is present, select it
  useEffect(() => {
    if (
      initialAssembly &&
      assemblies.length > 0 &&
      assemblies.some(asm => asm.referenceSetDbId === initialAssembly)
    ) {
      setCurrentAssembly(initialAssembly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAssembly, assemblies]);

  function handleTaxonChange(e) {
    const newTaxon = e.target.value;
    setCurrentTaxon(newTaxon);
    const isAnyTaxon = isAnyTaxonValue(newTaxon);

    // Find databases for this taxon
    const updatedDatabase = [];
    for (const set in instanceContent) {
      if (
        instanceContent[set].taxon === newTaxon ||
        isAnyTaxon ||
        (instanceContent[set].taxon === "(Unspecified taxon)" && newTaxon === "Unspecified taxon")
      ) {
        updatedDatabase.push({ id: instanceContent[set].database });
      }
    }

    // If more than one database, update URL to only contain the taxon
    if (updatedDatabase.length !== 1) {
      navigate(`/investigate/${newTaxon}`);
    }
  }
  const dropTempTables = async (database:string) => {
    const success = await api.delete(`${endpoints.DROP_TEMP_COLLECTIONS_URL}/${database}`, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        }
      }

    )
    console.log("Was deletion successful: ", success.data);

  }
  async function handleDatabaseChange(databaseId) {
    console.log("dss db: ", urlDatabase ,databaseId)
    if (currentDatabase !== databaseId && !(currentDatabase==="")){
      dropTempTables(currentDatabase);

    }
    
    setCurrentDatabase(databaseId);
    setCurrentProjects("");
    setCurrentAssembly("");
    setAssemblies([]);
    setProjectsDb([]);
    
    if (!databaseId) return;
    navigate(`/investigate/${currentTaxon}/${databaseId}`)
    try {
      const response = await api.post(`${endpoints.DATABASE_PROJECTS_URL}`, {
        datasetId: databaseId,
        pageSize: null,
        pageToken: null,
      }, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        }
      });
      const loadedProjects = response.data.variantSets;
      setProjectsDb(loadedProjects);

      // Auto-select if only one project, else reset
      if (loadedProjects.length === 1) {
        setCurrentProjects(loadedProjects[0].id);
        // Trigger handleProjectChange to load assemblies for this project
        handleProjectChange([loadedProjects[0].id], databaseId);
      } else {
        setCurrentProjects("");

        // Update URL to only contain taxon and database if more than one project
        if (urlProjects && urlProjects.split(',')[0].split('§')[0]===databaseId){
          handleProjectChange(urlProjects.split(','), databaseId);
        }
        else {
          navigate(`/investigate/${currentTaxon}/${databaseId}`);
        }
        
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleDatabaseSelect(e) {
    const databaseId = e.target.value;
    handleDatabaseChange(databaseId);
  }


  async function handleProjectChange(values, dbId) {

    console.log("dss pro: ", urlProjects , values)
    const projectIds = values;
console.log("dss pro: ", projectIds)
    console.log("dss navigate...");
    
    setCurrentProjects(projectIds.join(','));
    console.log("dss pro: ", currentProjects)
    setCurrentAssembly("");
    setAssemblies([]);
    if (projectIds.length === 0) {
      navigate(`/investigate/${currentTaxon}/${dbId || currentDatabase}`);
      return;
    }
    navigate(`/investigate/${currentTaxon}/${projectIds.join(',')}`);




    try {
      const response = await api.post(`${endpoints.BRAPI_SEARCH_REFERENCESETS_URL}`, {
        studyDbIds: projectIds
      }, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        }
      });
      const loadedAssemblies = response.data.result.data;
      setAssemblies(loadedAssemblies);

      if (loadedAssemblies.length === 1) {
        // Auto-select the only available assembly
        handleAssemblyChange({ target: { value: loadedAssemblies[0].referenceSetDbId } }, dbId, projectIds);
      } else if (assembly && loadedAssemblies.some(a => a.referenceSetDbId === assembly)) {
        // Previous assembly is valid for this project too — keep it
        handleAssemblyChange({ target: { value: assembly } }, dbId, projectIds);
      }
      // else: multiple assemblies and none matches → URL already at .../project (line 239),
      // assembly dropdown shows placeholder, user must select explicitly
      
      
    } catch (err) {
      console.error(err);
    }
  }

  function handleAssemblyChange(e, _dbId: unknown, projectIds: string | string[]) {
    const splitId = e.target.value.split("§"), assemblyId = splitId[1]
    setCurrentAssembly(e.target.value);
    console.log("dss a: ", urlProjects, assemblyId, projectIds)
    navigate(`/investigate/${currentTaxon}/${Array.isArray(projectIds) ? projectIds.join(',') : projectIds}/${e.target.value}`);
  }

  async function openProjectInfo() {
    setShowProjectInfo(true);
    setLoadingProjectInfo(true);
    try {
      const [description, runsByProject] = await Promise.all([
        fetchDatabaseSummary(api, currentDatabase),
        fetchRuns(api, currentProjects),
      ]);
      setDbDescription(description);

      // The runs endpoint keys its response by the bare numeric project id (e.g. "12"),
      // while projectsDb/currentProjects use the full "module§12" GA4GH variant set id —
      // match each selected project's full id to its run count via that numeric suffix.
      const countsByFullId: Record<string, number> = {};
      let totalRuns = 0;
      currentProjects.split(',').forEach((fullId: string) => {
        const numericId = fullId.includes('§') ? fullId.split('§')[1] : fullId;
        const runs = (runsByProject || {})[numericId];
        const count = Array.isArray(runs) ? runs.length : 0;
        countsByFullId[fullId] = count;
        totalRuns += count;
      });
      setRunCountsByProject(countsByFullId);
      setRunCount(totalRuns);
    } catch (err) {
      console.error("Error fetching project info:", err);
    } finally {
      setLoadingProjectInfo(false);
    }
  }

  return (
    <div className="dataset-selection-row">
      <Form.Select className="form-select-sm dataset-selection-select"
        value={currentTaxon}
        onChange={handleTaxonChange}
      >
        <option value="Any taxon">(Any taxon)</option>
        {taxons.map((taxon, idx) => (
          <option value={taxon === "" ? "Unspecified taxon" : taxon} key={idx}>{taxon === "" ? "(Unspecified taxon)" : taxon}</option>
        ))}
      </Form.Select>
      <Form.Select className="form-select-sm dataset-selection-select"
        value={currentDatabase}
        onChange={handleDatabaseSelect}
      >
        {referenceSets.length !== 1 && (
          <option value="">Database</option>
        )}
        {referenceSets.map((reference, idx) => (
          <option value={reference.id} key={idx}>{reference.id}</option>
        ))}
      </Form.Select>
      {currentDatabase && <MultiSelectDropdown
        options={projectsDb.map((p) => p.name || p.id)}
        selectedOptions={currentProjects ? currentProjects.split(',').map(id => { const p = projectsDb.find(p => p.id === id); return p ? (p.name || p.id) : id; }) : []}
        setSelectedOptions={(names) => handleProjectChange(names.map(name => { const p = projectsDb.find(p => (p.name || p.id) === name); return p ? p.id : name; }), currentDatabase)}
        title="Project"
        enableLookup={false}
        isLookup={true}

        toggleClassName="dataset-selection-select"
      />}
      {currentProjects && (
        <span
          className="dataset-selection-info-trigger"
          title="Click for project information"
          onClick={openProjectInfo}
        > 
          <span role="img" aria-label="info">ℹ️</span>
        </span>
      )}
      <Form.Select className="form-select-sm dataset-selection-select"
        value={currentAssembly}
        onChange={(e)=>{handleAssemblyChange(e,currentDatabase,currentProjects.split(','))}}
        hidden={assemblies.length <= 1}
        disabled={assemblies.length === 0}
      >
        {assemblies.length > 1 && (
          <option value="">Assembly</option>
        )}
        {assemblies.map((assembly, idx) => (
          <option value={assembly.referenceSetDbId} key={idx}>{assembly.referenceSetName || assembly.referenceSetDbId}</option>
        ))}
      </Form.Select>

      <ProjectInfoModal
        show={showProjectInfo}
        onClose={() => setShowProjectInfo(false)}
        loading={loadingProjectInfo}
        dbDescription={dbDescription}
        runCount={runCount}
        runCountsByProject={runCountsByProject}
        projects={currentProjects
          ? currentProjects.split(',').map(id => projectsDb.find(p => p.id === id)).filter(Boolean)
          : []}
      />
    </div>
  );
});

export default DatasetSelection;