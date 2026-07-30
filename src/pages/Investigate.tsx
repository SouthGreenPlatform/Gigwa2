import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faScrewdriverWrench, faTrash, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import FilterCard from "../components/FilterCard"
import IndividualCard from "../components/IndividualCard"
import { GroupFilter, useFilters, VariantFilter } from "../contexts/Filters"
import { useEffect, useState, useRef, useContext } from "react"
import { Container, Row, Accordion, Table, Button, FormCheck, FormSelect, Modal, OverlayTrigger, Tooltip, Form, AccordionContext, Overlay, Dropdown } from "react-bootstrap"
import VariantModal from "../components/VariantModal.tsx"
import { useApi } from "../contexts/Authentication.tsx"
import endpoints from "../endpoints"
import { useParams } from "react-router-dom"
import config from "../config/config";
import IGVBrowser from "../components/IGVBrowser";
import FullModal from "../components/FullModal.tsx";
import { useFullModal } from "../hooks/useFullModal";
import { FiltersProvider } from "../contexts/Filters";
import { useAuth } from "../contexts/Authentication.tsx";
import ExportPanel from "../components/ExportPanel";
import ExternalToolConfigModal from "../components/ExternalToolsConfigModal.tsx";
import ChartModal from "../components/ChartModal";
import ProgressDialog from "../components/ProgressDialog";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { fetchDistinctIndividualMetadata, fetchExportFormats, fetchGenotypePatterns, fetchHeaderDefinitionsForVariantAnnotations, fetchIndividuals, fetchNballeles, fetchProjectsDb, fetchRuns, fetchSearchableAnnotations, fetchSequences, fetchVariantAnnotations, fetchVariantDetails, fetchVariantEffects, fetchVariantTypes } from "../api/api.ts";
import { Axios, AxiosInstance } from "axios";
import "../styles/investigate.scss";
import React from "react";

const Investigate = () => {
  const { variantFilters, setVariantFilters, resetAllGroups, setGroupFilters, resetAllFilters } = useFilters()
  const [groupIDs, setGroupIDs] = useState<number[]>([])
  const [showToolConfigModal, setShowToolConfigModal] = useState(false)
  const [galaxyURL, setGalaxyURL] = useState(() => localStorage.getItem("galaxyURL") ?? "https://usegalaxy.fr");
  const [selectedTool, setSelectedTool] = useState("Custom tool");
  const [formats, setFormats] = useState("");
  const [toolURL, setToolURL] = useState("");
  const [isChanged, setIsChanged] = useState(false);
   const [browseEnabled,setBrowseEnabled] = useState(localStorage.getItem("browseEnabled")==='1')
   const [counted,setCounted] = useState(false);

  interface SnpClustLink {
    projId: string;
    shortProjId: string;
    label: string;
    url: string;
  }
  const [snpClustLinks, setSnpClustLinks] = useState<SnpClustLink[]>([]);
   
  const applyConfig = () => {
    if (galaxyURL.trim()) localStorage.setItem("galaxyURL", galaxyURL.trim());
    else localStorage.removeItem("galaxyURL");
  };
  // // Width of left panel (px)
  // const [leftWidth, setLeftWidth] = useState(405)
  // const containerRef = useRef<HTMLDivElement>(null)
  // const isDragging = useRef(false)
  const hasInitializedWorkWithSamples = useRef(false)
  // Prevents effects from firing on initial mount when assembly comes from the URL.
  // DatasetSelection strips the URL assembly on mount and re-confirms it through the
  // validation cascade, so we only fire server calls after that first clear cycle.
  const assemblyWasClearedRef = useRef(false)
  const { groupFilters, addGroup, deleteGroup } = useFilters()

  const [variantTypesOptions, setVariantTypesOptions] = useState([])
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [modalData, setModalData] = useState<Record<string, any> | null>(null);
  const [distinctIndividualMetadata, setDistinctIndividualMetadata] = useState({})
  const [showChartModal, setShowChartModal] = useState(false);


  // Close modal
  const handleCloseVariantModal = () => {
    setShowVariantModal(false);
    setModalData(null);
  };
  useEffect(() => {
    
    
    
  }, [groupFilters])
  const [resetFilters,setResetFilters]=useState(true)
  useEffect(() => {
    setCounted(false)
    setResetFilters(true)
  }, [variantFilters, groupFilters])


  const [headers, setHeaders] = useState(groupIDs.reduce((acc, id) => ({ ...acc, [id]: `Group ${id}` }), {}))

  const handleHeaderChange = (id, value) => {
    setHeaders((prev) => ({ ...prev, [id]: value }))
  }

  //////////////////////////// API CALLS //////////////////////////////////
  const api = useApi()
  const { token } = useAuth()
  const { taxon, dbOrProjects, assembly } = useParams()
  const database = dbOrProjects?.includes('§') ? dbOrProjects.split(',')[0].split('§')[0] : (dbOrProjects || "")
  const project = dbOrProjects?.includes('§') ? dbOrProjects : undefined
  const normalizedAssembly = typeof assembly === "string" ? decodeURIComponent(assembly).trim() : ""
  const hasSelectedAssembly =
    normalizedAssembly !== "" &&
    normalizedAssembly !== "undefined" &&
    normalizedAssembly !== "null" &&
    normalizedAssembly !== "Assembly" &&
    normalizedAssembly.includes("§")

  const [variantEffectOptions, setVariantEffectOptions] = useState([])
  const [nbAllelesOptions, setNbAllelesOptions] = useState([])
  const [referencesOptions, setReferencesOptions] = useState([])

  const [variantsSearch, setVariantsSearch] = useState({
    variants: [],
    count: 0,
  })
  const [headersDefinitions, setHeadersDefinitions] = useState({});
  const [loading, setLoading] = useState(false)
  const [showSearchProgress, setShowSearchProgress] = useState(false)
  const searchAbortRef = useRef<AbortController | null>(null)
  const [pageToken, setPageToken] = useState(0)
  const [individualsOptionsNames, setIndividualsOptionsNames] = useState([])
  const [individualsOptionsIDs, setIndividualsOptionsIDs] = useState([])
  const [searchableAnnotationsOptions, setSearchableAnnotationsOptions] = useState([])
  const [genotypePatternsOptions, setGenotypePatternsOptions] = useState<Record<string,string>>({});
  const [variantDetails, setVariantDetails] = useState([]);
  const [variantAnnotations, setVariantAnnotations] = useState({})
  const [exportFormats, setExportFormats] = useState({});
  const [showExportSetup, setShowExportSetup] = useState(false);
  const  [searchedVariants,setSearchedVariants] = useState(false);
    const [projectsAndRuns, setProjectsAndRuns] = useState<Record<string,string[]>>({});
    const [workWithSamples, setWorkWithSamples] = useState(false)



const handleShowVariantModal = async (row, variantId) => {
  setModalData(row);
  setShowVariantModal(true);

  const variantAnnotationFromServer = await fetchVariantAnnotations(api, variantId, project, assembly);

  setVariantAnnotations(variantAnnotationFromServer);

  const promises = Object.entries(projectsAndRuns).flatMap(
    ([projectId, runs]) => {
      return runs.map(async (run) => {
        const variantDetailsFromServer = await fetchVariantDetails(api, variantId, projectId, run, assembly);

        const projectName = databaseProjects.find( (p) => p?.id?.split("§")[1] === projectId)?.name;

        return {
          ...variantDetailsFromServer,
          calls: variantDetailsFromServer.calls.map((c) => ({
            ...c,
            info: {
              ...c.info,
              project: projectName,
              run: run,
            },
          })),
        };
      });
    }
  );

  try {
    const allRuns = await Promise.all(promises);
    setVariantDetails(allRuns);
  } catch (error) {
    console.error("Error fetching variant details:", error);
  }
};
  
  useEffect(() => {
    if (searchedVariants) {fetchVariantsSearch(true)}
  }, [pageToken])
  useEffect(()=>{
    
    if (browseEnabled===true && searchedVariants ){fetchVariantsSearch(false)}
  },[browseEnabled])

  const toInteger = (value: unknown, fallback = -1): number => {
    const parsed = Number.parseInt(String(value), 10)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  const buildSearchQuery = (variantFilters:VariantFilter,groupFilters:Record<string, GroupFilter>,usedPagination:boolean) => {
    let geneName = ""
    if (variantFilters.genesOnly) {
      geneName = "+";
    } else if (variantFilters.noGene) {
      geneName = "-";
    } else {
      if (variantFilters.geneFilter)
        geneName = variantFilters.selectedGeneNames.join(',');
      else
        geneName = "";
    }
    

    const discriminateArray =
      Object.keys(groupFilters).length > 0
        ? Object.values(groupFilters)
          .filter((group) => group && group.discriminateGroups !== undefined)
          .map((group) => (group.discriminateGroups === "null" ? null : group.discriminateGroups))
        : []

    
    let sMode=3;
    if (browseEnabled && !counted){
      sMode=3
      setCounted(true)
    }
    else if (!browseEnabled){
      sMode=0;
      setCounted(true)
    }
    else if ( counted && !usedPagination){
      sMode=1;
      setCounted(false)
    }
    else if (usedPagination) {
      sMode=2;
    }
    else {
      sMode=3;
    }

        const start = toInteger(variantFilters.selectedStart)
        const end = toInteger(variantFilters.selectedEnd)

    return {
          variantSetId: project,
          searchMode: sMode,
          getGT: false,
          referenceName: variantFilters.selectedSequences.length > 0 ? variantFilters.selectedSequences.join(";") : null,
          selectedVariantTypes: variantFilters.selectedVariantTypes.join(";"),
          alleleCount: variantFilters.selectedNbAlleles.join(";"),
          start,
          end,
          variantEffect: variantFilters.selectedVariantEffects.join(","),
          geneName: geneName,
          discriminate: discriminateArray,
          groupName: Object.keys(groupFilters).map((n) => groupFilters[n].name),
          pageSize: 100,
          pageToken: pageToken.toString(),
          sortBy: "",
          sortDir: "asc",
          selectedVariantIds: variantFilters.key === "variantID" ? variantFilters.selectedVariantIDs.join(';') : "",
          gtPattern: Object.values(groupFilters).map((group) => group["genotypePattern"]),
          mostSameRatio: Object.values(groupFilters).map((group) => group.mostSameRatio),
          minMaf: Object.values(groupFilters).map((group) => group["maf"][0]),
          maxMaf: Object.values(groupFilters).map((group) => group["maf"][1]),
          minMissingData: Object.values(groupFilters).map((group) => group["missing"][0]),
          maxMissingData: Object.values(groupFilters).map((group) => group["missing"][1]),
          minHeZ: Object.values(groupFilters).map((group) => group["heterozygosity"][0]),
          maxHeZ: Object.values(groupFilters).map((group) => group["heterozygosity"][1]),
          annotationFieldThresholds:
            Object.keys(groupFilters).length > 0
              ? Object.values(groupFilters).map((group) => group["searchableAnnotationsFilter"])
              : [],
          callSetIds: Object.keys(groupFilters).length > 0 ? Object.values(groupFilters)[0]["selectedIndividuals"].map(i=>database+'§'+i) : [],
          additionalCallSetIds:
            Object.keys(groupFilters).length > 1
              ? Object.values(groupFilters)
                .slice(1)
                .map((group) => group["selectedIndividuals"].map(i=>database+'§'+i))
              : [],
        }
  };
              
  const parseSearchQuery = (query) => {
    const groupNames = query.groupName || [];
    const variantFilters = {
      selectedSequences: query.referenceName?.split(";") || [],
      selectedVariantTypes: query.selectedVariantTypes?.split(";") || [],
      selectedNbAlleles: query.alleleCount?.split(";") || [],
      selectedStart: toInteger(query.start),
      selectedEnd: toInteger(query.end),
      selectedVariantEffects: query.variantEffect?.split(",") || [],
      selectedVariantIDs: query.selectedVariantIds?.split(";") || [],
      key: query.selectedVariantIds ? "variantID" : "filters",
      isCollapsed: false,
      nbGroups: groupNames.length,
      genesOnly: query.geneName === "+",
      noGene: query.geneName === "-",
      geneFilter: query.geneName && query.geneName !== "+" && query.geneName !== "-",
      selectedGeneNames:
        query.geneName && query.geneName !== "+" && query.geneName !== "-"
          ? query.geneName.split(",")
          : [],
    };

    const groupFilters = {};
    const gtPatterns = query.gtPattern || [];
    const discriminates = query.discriminate || [];
    const minMaf = query.minMaf || [];
    const maxMaf = query.maxMaf || [];
    const minMissing = query.minMissingData || [];
    const maxMissing = query.maxMissingData || [];
    const minHeZ = query.minHeZ || [];
    const maxHeZ = query.maxHeZ || [];
    const annotationThresholds = query.annotationFieldThresholds || [];
    const additionalCallSets = query.additionalCallSetIds || [];

    for (let i = 0; i < groupNames.length; i++) {
      groupFilters[i + 1] = {
        name: groupNames[i],
        selectedIndividuals:
          i === 0 ? query.callSetIds || [] : additionalCallSets[i - 1] || [],
        discriminateGroups: discriminates[i] === null ? "null" : discriminates[i],
        genotypePattern: gtPatterns[i],
        maf: [minMaf[i], maxMaf[i]],
        missing: [minMissing[i], maxMissing[i]],
        heterozygosity: [minHeZ[i], maxHeZ[i]],
        searchableAnnotationsFilter: annotationThresholds[i] || {},
      };
    }
    variantFilters.nbGroups=groupNames.length;
    setVariantFilters(variantFilters);
    setGroupFilters(groupFilters);
    return { variantFilters, groupFilters };
};

  const fetchVariantsSearch = async (usedPagination:boolean = false) => {
    searchAbortRef.current = new AbortController()
    setLoading(true)
    setShowSearchProgress(true)

    try {
      const VariantsSearch = await api.post(
        `${endpoints.VARIANTS_SEARCH_URL}`,
        buildSearchQuery(variantFilters,groupFilters,usedPagination),
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            assembly: assembly?.split("§")[1],
          },
          signal: searchAbortRef.current.signal,
        },
      )

      const searchData = VariantsSearch.data || {}
      setVariantsSearch({
        variants: searchData.variants || [],
        count: searchData.count || variantsSearch.count || 0,
        ...searchData,
      })
      if (searchData.count){
        setCounted(true)
      }
      
      setLoading(false)
      setShowSearchProgress(false)
      setResetFilters(false)
      return searchData
    } catch (err) {
      if (!searchAbortRef.current?.signal.aborted) {
        console.error("Error fetching variants:", err)
        setVariantsSearch({
          variants: [],
          count: 0,
        })
      }
      setLoading(false)
      setShowSearchProgress(false)
      return err
    }
  }

const [databaseProjects,setDatabaseProjects] = useState([]);

  useEffect(() => {
    if (!hasSelectedAssembly) {
      assemblyWasClearedRef.current = true
      return
    }
    if (!assemblyWasClearedRef.current) return

    
    setVariantFilters({
      key: "filters",
      geneFilter: false,
      isCollapsed: false,
      genesOnly: false,
      noGene: false,
      selectedVariantTypes: [],
      selectedVariantEffects: [],
      selectedNbAlleles: [],
      selectedStart: -1,
      selectedEnd: -1,
      selectedGeneNames: [],
      selectedVariantIDs: [],
      selectedSequences: [],
      nbGroups: 0,
    })
    resetAllGroups()
    setPageToken(0)
    setSearchedVariants(false)
    setVariantsSearch({variants: [], count: 0})
    if (project && assembly) {
      const loadRuns = async () => {
        const runsFromServer = await fetchRuns(api, project);
        setProjectsAndRuns(runsFromServer)
      }

      const loadVariantTypes = async () => {
        const variantTypesFromServer = await fetchVariantTypes(api,project);
        setVariantTypesOptions(variantTypesFromServer);
      }
      const loadVariantEffects = async () => {
        const variantEffectsFromServer = await fetchVariantEffects(api,project);
        setVariantEffectOptions(variantEffectsFromServer);
      }
      const loadNbAlleles = async () => {
        const numberOfAllelesFromServer = await fetchNballeles(api,project);
        setNbAllelesOptions(numberOfAllelesFromServer);
      }
      const loadSequences = async () => {
        const sequencesListFromServer = await fetchSequences(api,assembly);
        setReferencesOptions(sequencesListFromServer);
      }
      const loadIndividualsOrSamples = async () => {
        const individualsOrSamplesNamesAndIDsFromServer = await fetchIndividuals(api, workWithSamples, project);
        setIndividualsOptionsNames(individualsOrSamplesNamesAndIDsFromServer.names);
        setIndividualsOptionsIDs(individualsOrSamplesNamesAndIDsFromServer.IDs);
      }
      const loadDistinctIndividualsOrSamplesMetadata = async () => {
        const distinctIndividualsOrSamplesmetadataFromServer = await fetchDistinctIndividualMetadata(api, workWithSamples, database, project, assembly);
        setDistinctIndividualMetadata(distinctIndividualsOrSamplesmetadataFromServer)
      }
      const loadSearchableAnnotations = async () => {
        const searchableAnnotationsFromServer = await fetchSearchableAnnotations(api, project);
        setSearchableAnnotationsOptions(searchableAnnotationsFromServer);
      }
      loadRuns();
      loadVariantTypes();
      loadVariantEffects();
      loadNbAlleles();
      loadSequences();
      loadIndividualsOrSamples();
      loadDistinctIndividualsOrSamplesMetadata();
      loadSearchableAnnotations();
      
    }

    const loadExportFormats = async () => {
      const exportformatsFromServer = await fetchExportFormats(api);
      setExportFormats(exportformatsFromServer);
    }
    const loadGenotypePatterns = async () => {
      const genotypePatternsFromServer = await fetchGenotypePatterns(api);
      setGenotypePatternsOptions(genotypePatternsFromServer);
    }
    const loadprojectsDb = async () => {
      console.log("ici");
      const projectsDbFromServer = await fetchProjectsDb(api,database);
      setDatabaseProjects(projectsDbFromServer);
      console.log(projectsDbFromServer);
    }

    loadExportFormats();
    loadGenotypePatterns();
    loadprojectsDb();
    hasInitializedWorkWithSamples.current = true

  }, [assembly])


  useEffect(() => {
    if (!hasSelectedAssembly || !assemblyWasClearedRef.current) return;
      const loadIndividualsOrSamples = async () => {
        const individualsOrSamplesNamesAndIDsFromServer = await fetchIndividuals(api, workWithSamples, project);
        setIndividualsOptionsNames(individualsOrSamplesNamesAndIDsFromServer.names);
        setIndividualsOptionsIDs(individualsOrSamplesNamesAndIDsFromServer.IDs);
      }
      const loadDistinctIndividualsOrSamplesMetadata = async () => {
        const distinctIndividualsOrSamplesmetadataFromServer = await fetchDistinctIndividualMetadata(api, workWithSamples, database, project, assembly);
        setDistinctIndividualMetadata(distinctIndividualsOrSamplesmetadataFromServer)
      }
    loadIndividualsOrSamples();
    loadDistinctIndividualsOrSamplesMetadata();

    // Keep restored selections on initial page load; clear only when user toggles mode.
    if (!hasInitializedWorkWithSamples.current) {
      hasInitializedWorkWithSamples.current = true
      return
    }

    setGroupFilters((previousGroups) => {
      const nextGroups: Record<string, any> = {}
      Object.entries(previousGroups).forEach(([groupId, group]) => {
        nextGroups[groupId] = {
          ...group,
          selectedIndividuals: [],
        }
      })
      return nextGroups;
    })
  }, [workWithSamples])

  useEffect(() => {
    const currentGroupCount = Object.keys(groupFilters).length
    if (variantFilters.nbGroups !== currentGroupCount) {
      setVariantFilters((prev: any) => ({ ...prev, nbGroups: currentGroupCount }))
    }
  }, [groupFilters, variantFilters.nbGroups, setVariantFilters])

  const shiftGroupMemorizersAfterDeletion = (projectId: string, removedGroupId: number) => {
    const memorizerEntries = Object.keys(localStorage)
      .filter((key) => key.startsWith("groupMemorizer") && key.includes(`::${projectId}`))
      .map((key) => {
        const match = key.match(/^groupMemorizer(\d+)::/)
        return {
          key,
          groupId: match ? Number.parseInt(match[1], 10) : Number.NaN,
        }
      })
      .filter((entry) => !Number.isNaN(entry.groupId))
      .sort((a, b) => a.groupId - b.groupId)

    memorizerEntries.forEach(({ key, groupId }) => {
      if (groupId === removedGroupId) {
        localStorage.removeItem(key)
      }
    })

    memorizerEntries.forEach(({ key, groupId }) => {
      if (groupId > removedGroupId) {
        const savedSelection = localStorage.getItem(key)
        if (savedSelection !== null) {
          const shiftedKey = `groupMemorizer${groupId - 1}::${projectId}`
          localStorage.setItem(shiftedKey, savedSelection)
          localStorage.removeItem(key)
        }
      }
    })
  }

  // FIXED: Proper remove card function
  const removeCard = (groupId: string | number) => {
    
    const numericGroupId = typeof groupId === "number" ? groupId : Number.parseInt(groupId, 10)
    if (project && !Number.isNaN(numericGroupId)) {
      shiftGroupMemorizersAfterDeletion(project, numericGroupId)
    }
    deleteGroup(numericGroupId.toString())
  }

  const { showFullModal, fullModalContent, handleOpenFullModal, handleCloseFullModal } = useFullModal();
  function restoreGroupSelections(project: string) {
    const restoredIndividuals: Record<string, string[]> = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("groupMemorizer") && key.includes(`::${project}`)) {
        const match = key.match(/^groupMemorizer(.+?)::/);
        const groupID = match?.[1];
        const stored = localStorage.getItem(key);
        if (groupID && stored) {
          try {
            restoredIndividuals[groupID] = JSON.parse(stored);
          } catch (e) {
            console.error("Failed to parse stored selection for", key);
          }
        }
      }
    });

    const groupIDs = Object.keys(restoredIndividuals).sort((a, b) => Number(a) - Number(b));
    if (groupIDs.length === 0) return;

    // Update the "Investigate genotypes" select value
    setVariantFilters((prev: any) => ({ ...prev, nbGroups: groupIDs.length }));

    // Create all groups from scratch with full defaults + restored individuals in one atomic call,
    // so we never depend on a previous setGroupFilters call having already run.
    setGroupFilters(() => {
      const newFilters: Record<string, any> = {};
      groupIDs.forEach((storedGroupID, index) => {
        newFilters[String(index + 1)] = {
          name: "",
          selectedIndividuals: restoredIndividuals[storedGroupID],
          heterozygosity: [0, 100],
          missing: [0, 100],
          maf: [0, 50],
          genotypePattern: "Any",
          discriminateGroups: "null",
          searchableAnnotationsFilter: {},
        };
      });
      return newFilters;
    });
  }

const currentEventKey="1"
  const handleResetFiltersFromHeader = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const userConfirmed = window.confirm("Are you sure you want to reset the filters?")
    if (userConfirmed) {
      resetAllFilters()
    }
  }

  useEffect(() => {
    if (project) {
      const loadHeaderDefinitions = async () => {
        const headersDefinitionsFromServer = await fetchHeaderDefinitionsForVariantAnnotations(api, project);
        setHeadersDefinitions(headersDefinitionsFromServer);
      }
      restoreGroupSelections(project);
      loadHeaderDefinitions();

    } 
  }, [project, assembly])
  const [onlineOutputTools,setOnlineOutputTools]=useState({})
    useEffect(() => {
    if (!hasSelectedAssembly || !assemblyWasClearedRef.current) return;
    const fetchOnlineOutputTools = async () => {
      const resp = await api.get(
        `${endpoints.ONLINE_OUTPUT_TOOLS}`,
        {
          headers: { 
            "Content-Type": "application/json",
            accept: "application/json"
          },
        },
      );
      setOnlineOutputTools(resp.data || {});
    };
    fetchOnlineOutputTools();
  }, [assembly]);

  //snpclust
  useEffect(() => {
    async function fetchSnpClustLinks() {
      
      if (!project) {
        setSnpClustLinks([]);
        return;
      }

      const projectIds: string[] = project.split(",").filter(Boolean);
      console.log(projectIds);

      const results = await Promise.all(
        projectIds.map(async (projId): Promise<SnpClustLink | null> => {
          try {
            const shortProjId = projId.split("§")[1];
            const resp = await api.get(
              `${endpoints.SNPCLUST_EDITION_URL}?module=${database}&project=${shortProjId}`,
              {
                headers: {  
                  "Content-Type": "application/json",
                  accept: "application/json"
                },
              },
            );   
                   
            const url = await resp.data;            
            if (url) {
              const label = databaseProjects.find( (p) => p?.id === projId)?.name;
              return { projId, shortProjId, label, url };
            }
          } catch (error) {
          }
          return null;
        })
      );
      console.log(results);
      setSnpClustLinks(results.filter((r): r is SnpClustLink => r !== null));
    }
    fetchSnpClustLinks();
  }, [databaseProjects, project]);

  /////////////////////////////////////////////////////////////////////////
  const toolConfigRef = React.useRef(null);

  const [tooltip, setTooltip] = React.useState({
    toolConfig: false,
  });
  return (
    
    <Container fluid id="variantSearchResults" className="investigate-root">
      {hasSelectedAssembly &&
       <>
      <PanelGroup className="investigate-panel-group">
        <Panel defaultSize="415px" minSize="15%" maxSize="70%" collapsible collapsedSize={0}>
          <div className="investigate-left-panel">       


          <Accordion alwaysOpen defaultActiveKey="filters" className="investigate-filter-accordion mt-1">
            <Accordion.Item eventKey="filters">
              <Accordion.Header>
                <span className="investigate-filter-title">Filter variants</span>
                <Button
                  size="sm"
                  variant="primary"
                  className="investigate-filter-reset-btn"
                  onClick={handleResetFiltersFromHeader}
                >
                  Reset filters
                </Button>
              </Accordion.Header>
              <Accordion.Body className="p-0">
                <FilterCard
                  title=""
                  description=""
                  variantTypes={variantTypesOptions}
                  variantEffects={variantEffectOptions}
                  numberAlleles={nbAllelesOptions}
                  sequences={referencesOptions}
                />
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <div className="mt-1">
            {Object.entries(groupFilters).map(([groupID, groupData]) => (
              <div key={groupID} className="mb-1">
                  <IndividualCard
                    groupID={Number.parseInt(groupID)}
                    title="Name"
                    onDelete={() => removeCard(groupID)}
                    individualsNames={individualsOptionsNames}
                    individualsIDs={individualsOptionsIDs}
                    searchableAnnotations={searchableAnnotationsOptions}
                    distinctMetadata={distinctIndividualMetadata}
                    genotypePatterns={genotypePatternsOptions}
                    workWithSamples={workWithSamples}
                  />
              </div>
            ))}
            </div>
         
        </div>
      </Panel>

      <PanelResizeHandle className="investigate-resize-handle" />

        {/* Right content area fills remaining space */}
          <Panel>
            <div className="investigate-right-panel">
            {/* Navigation and Export/IGV panel side by side */}
            <div className="investigate-top-toolbar">
              <Button className="investigate-search-btn" disabled={project===undefined || assembly===undefined} onClick={() => { setSearchedVariants(true);setPageToken(0); fetchVariantsSearch(false); }}>Search</Button>
              <Form.Check
              className="browse-checkbox"
                type="checkbox"
                label="Enable Browse and Export"
                checked={browseEnabled}
                onChange={(e) => {
                            setBrowseEnabled(e.target.checked);
                            localStorage.setItem("browseEnabled", e.target.checked ? "1" : "0");
                          }}
              />
              <Form.Check
              className="browse-checkbox"
                type="checkbox"
                label="Work on samples"
                checked={workWithSamples}
                onChange={(e) => setWorkWithSamples(e.target.checked)}
              />


              {searchedVariants && browseEnabled && !loading &&
              <>
              
              <div id="variantSearchResultsNavigation">
                <Button variant="outline-secondary" size="sm" className="investigate-nav-btn" onClick={() => setPageToken(pageToken - 1)} disabled={pageToken < 1} title="Previous page">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </Button>
                <span className="investigate-nav-range">
                  {Math.min(variantsSearch.count, pageToken * 100 + 1)}–{Math.min(variantsSearch.count, (pageToken + 1) * 100)}
                  <span className="investigate-nav-total"> / {variantsSearch.count}</span>
                </span>
                <Button variant="outline-secondary" size="sm" className="investigate-nav-btn" onClick={() => setPageToken(pageToken + 1)} disabled={variantsSearch.count < (pageToken + 1) * 100} title="Next page">
                  <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              </div>

              <div id="currentDataOutputs" className="investigate-current-data-outputs">
                <Button
                  variant="primary"
                  onClick={() => handleOpenFullModal({ title: "View current data in IGV" })}
                >
                  Open IGV Viewer
                </Button>
                <FullModal show={showFullModal} title={fullModalContent?.title || ""} showHeader={false} onClose={handleCloseFullModal} >
                  <FiltersProvider>
                    {(() => {
                      // Build initialLocus if a precise range is selected
                      let initialLocus = "";
                      if (variantFilters.selectedSequences.length === 1 && 
                          variantFilters.selectedStart >= 0 && 
                          variantFilters.selectedEnd >= 0) {
                        initialLocus = `${variantFilters.selectedSequences[0]}:${variantFilters.selectedStart}-${variantFilters.selectedEnd}`;
                      }
                      return (
                        <IGVBrowser
                          database={database}
                          chromosomes={referencesOptions.map(r => r.referenceName)}
                          buildSearchQuery={buildSearchQuery}
                          groupFilters={groupFilters}
                          variantFilters={variantFilters}
                          individualsOptionsNames={individualsOptionsNames}
                          initialLocus={initialLocus}
                          onClose={handleCloseFullModal}
                        />
                      );
                    })()}
                  </FiltersProvider>
                </FullModal>

                <Button variant="primary" onClick={() => setShowChartModal(true)}>
                  Open Charts
                </Button>

                <Button
                  className={`rounded-circle investigate-export-toggle${showExportSetup ? " border border-primary investigate-export-toggle-active" : ""}`}
                  title="Export"
                  aria-pressed={showExportSetup}
                  onClick={() => setShowExportSetup(v => !v)} // <-- Add this line
                >
                  <span
                    className={`investigate-export-icon${showExportSetup ? " investigate-export-icon-active" : ""}`}
                    role="img"
                    aria-label="save"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </span>
                </Button>
                
                <Button
                  ref={toolConfigRef}
                  onClick={() => setShowToolConfigModal(true)}
                  onMouseEnter={() => setTooltip(t => ({ ...t, toolConfig: true }))}
                  onMouseLeave={() => setTooltip(t => ({ ...t, toolConfig: false }))}
                >
                  <FontAwesomeIcon icon={faScrewdriverWrench} />
                </Button>

                {snpClustLinks.length > 0 && (
                  <Dropdown>
                    <Dropdown.Toggle
                      as="span"
                      bsPrefix="snpclust-toggle"
                      style={{ cursor: "pointer" }}
                      id="snpclust-dropdown"
                    >
                      <img
                        style={{ marginLeft: 8 }}
                        title="Edit genotypes with SnpClust"
                        src="/img/logo_snpclust.png"
                        height={30}
                        width={30}
                        alt="SnpClust"
                      />
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {snpClustLinks.map(({ projId, url, label }) => (
                        <Dropdown.Item
                          key={projId}
                          href={`${url}?maintoken=${token}&mainapiURL=${location.origin}${endpoints.REST_BASE_URL}&mainbrapistudy=${projId}&mainbrapiprogram=${database}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open project <strong>{label}</strong> in SnpClust
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                )}

                <Overlay
                  target={toolConfigRef.current}
                  show={tooltip.toolConfig}
                  placement="top"
                >
                  {(props) => (
                    <Tooltip {...props}>
                      Configure external tools
                    </Tooltip>
                  )}
                </Overlay>
                <ExportPanel
                  project={project}
                  assembly={assembly}
                  groupFilters={groupFilters}
                  variantFilters={variantFilters}
                  exportFormats={exportFormats}
                  show={showExportSetup}
                  onClose={() => setShowExportSetup(false)}
                  referencesOptions={referencesOptions}
                  buildSearchQuery={buildSearchQuery}
                  metadata={Object.keys(distinctIndividualMetadata)}
                  galaxyURL={galaxyURL}
                  onOpenToolConfig={() => setShowToolConfigModal(true)}
                />
              </div>

                       </> }
              
            </div>

            {/* Table or loading spinner */}
{loading && (
    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 investigate-loading-overlay"
    >
      <div className="text-center">
        <span className="spinner-border text-secondary me-2" role="status" aria-hidden="true"></span>
        <i className="bi bi-clock-history me-2 investigate-loading-icon"></i>
        <span>Loading variants...</span>
      </div>
    </div>
  )}
{
  !loading && searchedVariants && browseEnabled &&
  <div className="investigate-table-scroll">
    <Table
      striped
      bordered
      hover
      className="mb-0 main-variant-results-table investigate-results-table"
    >
      <thead className="bg-light">
        <tr>
          <th>ID</th>
          <th>Sequence</th>
          <th>Start</th>
          <th>End</th>
          <th>Alleles</th>
          
          {variantsSearch?.variants[0]?.info?.EFF_ge && (
            <>
              <th>Effect</th>
              <th>Gene</th>
            </>
          )}
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {!loading &&
          (variantsSearch?.variants || []).map((variant, rowIndex) => (
            <tr key={rowIndex}>
              <td>{variant?.id?.split("§")[2]}</td>
              <td>{variant?.referenceName}</td>
              <td>{variant?.start}</td>
              <td>{variant?.end}</td>
              <td>
                <span
                 className="investigate-allele-badge investigate-allele-ref"
                >{variant?.referenceBases}</span>
                {variant?.alternateBases?.map((val, i) => (
                  <span 
                    key={i} 
                    className="investigate-allele-badge investigate-allele-alt"
                  >
                    {val}
                  </span>
                ))}
              </td>


              {variantsSearch?.variants[0]?.info?.EFF_ge && (
                <>
                  <td>
                    <div>
                      {(variant?.info?.EFF_nm || []).map((effect, i) => (
                        <div key={i}>{effect}</div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div>
                      {(variant?.info?.EFF_ge || []).map((gene, i) => (
                        <div key={i}>{gene}</div>
                      ))}
                    </div>
                  </td>
                </>
              )}
              <td>
                <Button
                  variant="primary"
                  className="investigate-view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowVariantModal(variant?.referenceName, variant?.id);

                  }}
                >
                  View Details
                </Button>
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  </div>
}
{
  !browseEnabled && searchedVariants &&
   <div className="investigate-count-pill">
  {variantsSearch?.count} Variants found
</div>
}
  
        {showVariantModal &&
          <>
            <VariantModal
              show={showVariantModal}
              variantDetails={variantDetails}
              onClose={handleCloseVariantModal}
              handleShowModal={handleShowVariantModal}
              variantsIDs = {variantsSearch?.variants?.map(v => v?.id)}
              variantAnnotation={variantAnnotations}
              groups={Object.values(groupFilters).map((group) => group.selectedIndividuals)}
              project={project}
              bioEntitiesLength={individualsOptionsIDs?.length}
              workwithSamples={workWithSamples}
              searchableAnnotations={searchableAnnotationsOptions}
              headersDefinitions={headersDefinitions}
            />
          </>
        }
          
            </div>
  </Panel>
</PanelGroup>
      <ExternalToolConfigModal
        show={showToolConfigModal}
        onClose={() => setShowToolConfigModal(false)}
        galaxyURL={galaxyURL}
        setGalaxyURL={setGalaxyURL}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        formats={formats}
        setFormats={setFormats}
        toolURL={toolURL}
        setToolURL={setToolURL}
        isChanged={isChanged}
        setIsChanged={setIsChanged}
        onApply={applyConfig}
        onlineOutputTools={onlineOutputTools}
      />
      <ProgressDialog
        progressToken={`${token}`}
        show={showSearchProgress}
        onHide={() => { setShowSearchProgress(false); }}
        autoClose={true}
        title="Searching variants…"
        showAbort={true}
        onAbort={() => { searchAbortRef.current?.abort(); setLoading(false); setShowSearchProgress(false); }}
        nbMin={1}
      />
      <ChartModal
        show={showChartModal}
        onClose={() => setShowChartModal(false)}
        sequences={referencesOptions}
        variantTypes={variantTypesOptions}
        allIndividualNames={individualsOptionsNames}
        project={project}
        assembly={assembly}
        database={database}
        groupFilters={groupFilters}
        variantFilters={variantFilters}
        distinctMetadata={distinctIndividualMetadata}
      />
     </>
}
    </Container>
  )
}

export default Investigate