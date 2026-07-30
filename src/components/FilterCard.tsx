import React, { useState,useEffect, type ClipboardEvent } from 'react';

const formatPos = (n: number) =>
  n === -1 ? "" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
import {  InputGroup, ListGroupItem, Row, Col, DropdownButton, Dropdown, DropdownMenu, OverlayTrigger, Tooltip, Collapse, Modal, ButtonGroup, Overlay } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import { useApi, useAuth } from "../contexts/Authentication.tsx"
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import MultiSelectDropdown from './MultiSelect';
import { GroupFilter, useFilters, VariantFilter} from '../contexts/Filters';
import { useParams } from "react-router-dom"
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faPen,
  faPaste,
  faLessThanEqual,
  faGreaterThanEqual,
  faFileImport,
  faCopy

} from "@fortawesome/free-solid-svg-icons";
import endpoints from '../endpoints';
import InputLookupModal from './InputLookupModal.tsx';
import '../styles/filter-card.scss';
import SavedQueriesModal from './SavedQueriesModal.tsx';

// Define the props interface
interface FilterCardProps {
  title?: string;
  description?: string;
  variantTypes?:Array<string>;
  numberAlleles?:Array<string>;
  variantEffects?:Array<string>;
  sequences?:Array<Record<string,string>>


  onClick?: () => void;
}

// Create the functional component
const FilterCard: React.FC<FilterCardProps> = ({
  title = 'Default Title',
  description = 'Default description text',
  variantTypes=[],
  numberAlleles=[],
  variantEffects=[],
  sequences=[],
  onClick,
}) => {
  
     const {dbOrProjects}=useParams()
     const project = dbOrProjects?.includes('§') ? dbOrProjects : undefined
     const { variantFilters, groupFilters,setVariantFilters,setGroupFilters,setKey,setGeneFilter,setIsCollapsed,setGenesOnly,setNoGene,setSelectedVariantTypes, setSelectedVariantEffects, setSelectedNbAlleles,setSelectedStart, setSelectedEnd,setSelectedGeneNames,setSelectedSequences , setNbGroups,setSelectedVariantIDs} = useFilters()
     const api = useApi();
   
    const [geneSearch,setGeneSearch] = useState("");
    const [varIdSearch,setVarIdSearch] = useState("");
    const [geneSearchRes,setGeneSearchRes]=useState([]);
    const [varIdSearchRes,setVarIdSearchRes]=useState([]);
    const [savedQueries,setSavedQueries]=useState({});
     const fetchGeneNames = async () => {
       
        const geneResults = await api.get(`${endpoints.GENE_LOOKUP_URL}?q=${geneSearch}&projectId=${project}`, {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    })

    const res = geneResults.data
    setGeneSearchRes(res)
    console.log("got genes", res)
  }

  const fetchVariantIDs = async () => {
        const varResults = await api.get(`${endpoints.VARIANT_LOOKUP_URL}?q=${varIdSearch}&projectId=${project}`, {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    })

    const res = varResults.data
    setVarIdSearchRes(res)
    console.log("got variants: ", res)
  }  
    useEffect(() => {
      if (geneSearch.length>=3){
        fetchGeneNames();
      }
      else {
        setGeneSearchRes([])
      }
    
  }, [geneSearch])
  useEffect(() => {
    if (varIdSearch.length>=3){
      fetchVariantIDs()
    }
  }, [varIdSearch])
    
   
  const toggleCard = () => {
    setIsCollapsed( !variantFilters.isCollapsed);
  };

  const GenesOnly = () => {
    setGeneFilter(false);
    setGenesOnly(!variantFilters.genesOnly);
    setNoGene(false);
  }
  const NoGene = () => {
    setNoGene(!variantFilters.noGene);
    setGenesOnly(false);
    setGeneFilter(false);
  }

  function EnableGeneLookup(): void {
    setGeneFilter(!variantFilters.geneFilter);
    setGenesOnly(false);
    setNoGene(false);
  }
  function PasteGenesIDs(){
    setGenesOnly(false);
    setNoGene(false);

    console.log("Show gene selection modal") 
   }
  function clearInvalidGroupMemorizers(projectId: string, maxValidGroupId: number): void {
    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith("groupMemorizer") || !key.includes(`::${projectId}`)) {
        return
      }

      const match = key.match(/^groupMemorizer(\d+)::/)
      const groupId = match ? Number.parseInt(match[1], 10) : Number.NaN
      if (!Number.isNaN(groupId) && groupId > maxValidGroupId) {
        localStorage.removeItem(key)
      }
    })
  }

  function setGroups(value: string | number): void {
    const nextNbGroups = typeof value === "number" ? value : Number.parseInt(value, 10)
    const currentNbGroups = Object.keys(groupFilters).length

    if (project && !Number.isNaN(nextNbGroups) && nextNbGroups < currentNbGroups) {
      clearInvalidGroupMemorizers(project, nextNbGroups)
    }

    setNbGroups(nextNbGroups)
  }


   const [fileContent, setFileContent] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result.toString();
        const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
        setSelectedVariantIDs(lines);
        console.log("Updated Variant IDs:", variantFilters.selectedVariantIDs);
      };
      reader.readAsText(file);
    }
  };

  const buildSearchQuery = (variantFilters:VariantFilter,groupFilters:Record<string, GroupFilter>) => {
    let geneName = ""
    if (variantFilters.genesOnly) {
      geneName = "+"
    } else if (variantFilters.noGene) {
      geneName = "-"
    } else {
      if (variantFilters.geneFilter) {
        geneName = variantFilters.selectedGeneNames.join(',');
      } else {
        geneName = ""
      }
    }
    console.log("geneName: ", geneName)

    const discriminateArray =
      Object.keys(groupFilters).length > 0
        ? Object.values(groupFilters)
          .filter((group) => group && group.discriminateGroups !== undefined)
          .map((group) => (group.discriminateGroups === "null" ? null : group.discriminateGroups))
        : []

    console.log("Discriminate array:", discriminateArray)

    return {
          variantSetId: project,
          searchMode: 3,
          getGT: true,
          referenceName: variantFilters.selectedSequences.join(";"),
          selectedVariantTypes: variantFilters.selectedVariantTypes.join(";"),
          alleleCount: variantFilters.selectedNbAlleles.join(";"),
          start: variantFilters.selectedStart,
          end: variantFilters.selectedEnd,
          variantEffect: variantFilters.selectedVariantEffects.join(","),
          geneName: geneName,
          callSetIds: Object.keys(groupFilters).length > 0 ? Object.values(groupFilters)[0]["selectedIndividuals"].map(i=>project+'§'+i) : [],
          discriminate: discriminateArray,
          groupName: Object.keys(groupFilters).map((n) => groupFilters[n].name),
          pageSize: 100,
          pageToken: 0,
          sortBy: "",
          sortDir: "asc",
          selectedVariantIds: variantFilters.key === "variantID" ? variantFilters.selectedVariantIDs.join(';') : "",
          gtPattern: Object.values(groupFilters).map((group) => group["genotypePattern"]),
          mostSameRatio: Object.values(groupFilters).map((group) => 100),
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
          additionalCallSetIds:
            Object.keys(groupFilters).length > 1
              ? Object.values(groupFilters)
                .slice(1)
                .map((group) => group["selectedIndividuals"].map(i=>project+'§'+i))
              : [],
        }
  };

  const parseSearchQuery = (query) => {
    const variantFilters = {
      nbGroups:0,
      isCollapsed:false,
      selectedSequences: query.referenceName!==""?query.referenceName.split(";"):[],
      selectedVariantTypes: query.selectedVariantTypes!==""?query.selectedVariantTypes?.split(";"):[],
      selectedNbAlleles: query.alleleCount!==""?query.alleleCount.split(";"):[],
      selectedStart: query.start,
      selectedEnd: query.end,
      selectedVariantEffects: query.variantEffect!==""?query.variantEffect.split(","):[],
      selectedVariantIDs: query.selectedVariantIds!==""?query.selectedVariantIds.split(";"):[],
      key: query.selectedVariantIds!=="" ? "variantID" : "filters",

      genesOnly: query.geneName === "+",
      noGene: query.geneName === "-",
      geneFilter: query.geneName && query.geneName !== "+" && query.geneName !== "-",
      selectedGeneNames:
        query.geneName && query.geneName !== "+" && query.geneName !== "-"
          ? query.geneName.split(",")
          : [],
    };
    console.log("var fil: ", variantFilters)
    const groupFilters = {};
    const groupNames = query.groupName || [];
    const gtPatterns = query.gtPattern || [];
    const discriminates = query.discriminate || [];
    const minMaf = query.minMaf || [];
    const maxMaf = query.maxMaf || [];
    const minMissing = query.minMissingData || [];
    const maxMissing = query.maxMissingData || [];
    const minHeZ = query.minHeZ || [];
    const maxHeZ = query.maxHeZ || [];
    const annotationThresholds = query.annotationFieldThresholds || [];
    const additionalCallSets = query.additionalCallSetIds?.length>0?query.additionalCallSetIds.map(i=>i.map(l=>l.split('§')[2])):[];

    for (let i = 0; i < groupNames.length; i++) {
      groupFilters[i + 1] = {
        name: groupNames[i],
        selectedIndividuals: i === 0 ? query.callSetIds.length>0?query.callSetIds.map(i=>i.split('§')[2]):[] : additionalCallSets[i - 1] || [],
        discriminateGroups: discriminates[i] === null ? "null" : discriminates[i],
        genotypePattern: gtPatterns[i],
        maf: [minMaf[i], maxMaf[i]],
        missing: [minMissing[i], maxMissing[i]],
        heterozygosity: [minHeZ[i], maxHeZ[i]],
        searchableAnnotationsFilter: annotationThresholds[i] || {},
      };
  }
  setNbGroups(groupNames.length)
  //variantFilters.nbGroups=groupNames.length;
  setVariantFilters(variantFilters);
  setGroupFilters(groupFilters);
  console.log("parsed")
  return { variantFilters, groupFilters };
};

const saveQuery = async (query, name: string) => {
  query.queryLabel=name;
  console.log("saving query: ",query)
 
       api.post(`${endpoints.SAVE_QUERY_URL}`, 
          query,
          
          {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    })
  
}

const loadQueries = async () => {
    const queriesList= await api.get(`${endpoints.LOAD_QUERIES_URL}?module=${project?.split('§')[0]}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });
    const queries = queriesList.data;
    console.log("we got those queries: ", queries)
    return queries;  
}

  function HandleSaveQuery(): void {
    const name = prompt('Give your query a name to identify it:');
    if (name) {
      saveQuery(buildSearchQuery(variantFilters,groupFilters),name) 
    }
    
  } 
  async function HandleListQuery(){
    const loadedQueries= await loadQueries();
    console.log("you got those queries saved: ", loadedQueries)
    setSavedQueries(loadedQueries);
  }
  const [showSavedQueriesManagement, setShowSavedQueriesManagement] = useState(false);

  const handleShow = () => setShowSavedQueriesManagement(true);
  const handleClose = () => setShowSavedQueriesManagement(false)
  const loadQueryById = async (queryID)=>{
    const loadedQuery = await api.get(`${endpoints.LOAD_QUERY_URL}?module=${project?.split('§')[0]}&queryId=${queryID}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    })
    const query= loadedQuery.data;
    parseSearchQuery(query)
  }
  function handleLoadQueryById(queryID: string) {
    console.log("loading query: ", savedQueries[queryID])
    loadQueryById(queryID);
  }
  const deleteQuery = async (queryID) =>{
    await api.delete(`${endpoints.DELETE_QUERY_URL}?module=${project?.split('§')[0]}&queryId=${queryID}`,
          
          {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    })

  }
  function handleDeleteQuery(queryID){
    const userConfirmed = window.confirm("Are you sure you want to delete this query?");
  
  if (userConfirmed) {
    deleteQuery(queryID);
  }}

  
  const [showVarIdLookupModal, setshowVarIdLookupModal] = useState(false);
  const [VarIdLookupInputText, setVarIdLookupInputText] = useState("");
  const [showGeneLookupModal, setshowGeneLookupModal] = useState(false);
  const [GeneLookupInputText, setGeneLookupInputText] = useState("");

  const handleCloseVarIdLookup = () => setshowVarIdLookupModal(false);

  const handleCancelVarIdLookup = () => {
    setVarIdLookupInputText("");
    setshowVarIdLookupModal(false);
  };
  const handleCancelGeneLookup = () => {
    setGeneLookupInputText("");
    setshowGeneLookupModal(false);
  };

  const handlePositionPaste = (primary: (v: number) => void) =>
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const parts = e.clipboardData.getData("text").trim().split(/\D+/).filter(Boolean)
      if (parts.length >= 2) {
        setSelectedStart(Number(parts[0]))
        setSelectedEnd(Number(parts[parts.length - 1]))
      } else if (parts.length === 1) {
        primary(Number(parts[0]))
      }
    }

  function handlePasteVarIds(): void {
    console.log("paste")
        setshowVarIdLookupModal(true)
    
  }
  function handlePasteGene(): void {
    console.log("paste")
        setshowGeneLookupModal(true)
    
  }

  const handleApplyVarIdLookup = () => {
    console.log("Submitted Gene Lookup input:", VarIdLookupInputText);
    setSelectedVariantIDs(VarIdLookupInputText.split('\n'))
    setshowVarIdLookupModal(false);
  };
  const handleApplyGeneLookup = () => {
    console.log("Submitted Gene Lookup input:", GeneLookupInputText);
    setGeneFilter(true)
    setSelectedGeneNames(GeneLookupInputText.split('\n'))
    setshowGeneLookupModal(false);
  };
  const plusRef = React.useRef(null);
  const minusRef = React.useRef(null);
  const penRef = React.useRef(null);
  const pasteRef = React.useRef(null);
  const selectRef = React.useRef(null);

  
  const [tooltip, setTooltip] = React.useState({
    plus: false,
    minus: false,
    pen: false,
    paste: false,
    investigate: false,
  });
  const {isAuthenticated} = useAuth()
  return (
    <div className="filter-variants">
      
        <Collapse in={!variantFilters.isCollapsed} dimension="width" timeout={0}>
        <div>
        <Card bg="light" className="p-0 m-0 fw-bold filter-card-shell">
        <Card.Header>
         {isAuthenticated && (
          <Dropdown as={ButtonGroup}>
            <Dropdown.Toggle variant="primary" id="dropdown-queries">
              Queries
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={HandleSaveQuery}>Save this query</Dropdown.Item>
              <Dropdown.Item onClick={() => {
                handleShow();
                HandleListQuery();
              }}>
                List your saved queries
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
        </Card.Header>
      <Card.Body className="me-0 ms-0 p-1" >
        <div 
      className="p-0 m-0" >
        
    <Tabs
      activeKey={variantFilters.key}
      onSelect={(k) => setKey(k)}
      id="controlled-tab"
    >
      <Tab eventKey="filters" title="Filter on all variants">
      
      <Form>
        
      <Row className="align-items-center mt-2 gx-2">
        {variantTypes?.length > 1 && <Col xs={6} sm={6} md={6}>
          <MultiSelectDropdown  title="Variant Types" options={variantTypes} selectedOptions={variantFilters.selectedVariantTypes} setSelectedOptions={setSelectedVariantTypes}/>
        </Col>}

        {numberAlleles?.length > 1 && <Col xs={6} sm={6} md={6}>
          <MultiSelectDropdown title="Number of Alleles" options={numberAlleles} selectedOptions={variantFilters.selectedNbAlleles} setSelectedOptions={setSelectedNbAlleles} />
        </Col>}
      </Row>
      {(variantTypes?.length > 1 || numberAlleles?.length > 1) && <hr className="filter-card-separator" />}
      <Row className="align-items-center mt-1 gx-2">
        {sequences?.length > 1 && <Col xs={6} sm={6} md={6}>
          <MultiSelectDropdown title='Sequences' options={sequences.map((s) => s.referenceName)} enableLookup={true} selectedOptions={variantFilters.selectedSequences} setSelectedOptions={setSelectedSequences} />
        </Col>}

        {variantEffects?.length > 1 && <Col xs={6} sm={6} md={6}>
          <MultiSelectDropdown title='Variant Effects' options={variantEffects} enableLookup={true} selectedOptions={variantFilters.selectedVariantEffects} setSelectedOptions={setSelectedVariantEffects}/>
        </Col>}
      </Row>
      {(sequences?.length > 1 || variantEffects?.length > 1) && <hr className="filter-card-separator" />}
      <Row className="align-items-center">
      <Form.Label className="mb-0 text-start">Position (bp)</Form.Label>
        <Col>
        <InputGroup className="m-0">
        <InputGroup.Text><FontAwesomeIcon icon={faGreaterThanEqual} /></InputGroup.Text>
          <Form.Control
            type='text'
            inputMode='numeric'
            value={formatPos(variantFilters.selectedStart)}
            className="filter-card-no-spinner filter-card-position-input"
            onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); setSelectedStart(raw ? Number(raw) : -1) }}
            onPaste={handlePositionPaste(setSelectedStart)}
          />
      </InputGroup>
        </Col>
        <Col>
        <InputGroup className="m-0">
        <InputGroup.Text><FontAwesomeIcon icon={faLessThanEqual} /></InputGroup.Text>
          <Form.Control
            type='text'
            inputMode='numeric'
            value={formatPos(variantFilters.selectedEnd)}
            className="filter-card-no-spinner filter-card-position-input"
            onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); setSelectedEnd(raw ? Number(raw) : -1) }}
            onPaste={handlePositionPaste(setSelectedEnd)}
          />
      </InputGroup>
        </Col>
      </Row>
      {variantEffects?.length > 1 && <><hr className="filter-card-separator" />
      <Row className=" ">
      <Form.Label className="mb-0 text-start">Genes Names</Form.Label>
      <Col>
      <Form.Control disabled={!variantFilters.geneFilter} value={geneSearch} onChange={(e)=>{setGeneSearch(e.target.value)}}></Form.Control>
{variantFilters.geneFilter && (
  geneSearch.length < 3 && variantFilters.selectedGeneNames.length === 0 ? (
    <p>Please type more</p>
  ) : (
    <>
      {(geneSearchRes.length > 0 && geneSearchRes[0] !== "Too many results, please refine search!") ||
      variantFilters.selectedGeneNames.length > 0 ? (
        <MultiSelectDropdown
          options={Array.from(
            new Set([
              ...(geneSearchRes.length === 1 && geneSearchRes[0] === "Too many results, please refine search!"
                ? []
                : geneSearchRes ?? []),
              ...variantFilters.selectedGeneNames
            ])
          )}
          title='Selected genes'
          enableLookup
          isLookup
          selectedOptions={variantFilters.selectedGeneNames}
          setSelectedOptions={setSelectedGeneNames}
        />
      ) : null}

      {geneSearchRes.length === 1 && geneSearchRes[0] === "Too many results, please refine search!" ? (
        <p>{geneSearchRes[0]}</p>
      ) : geneSearchRes.length === 0 && geneSearch.length > 0 ? (
        <p>No options found</p>
      ) : null}
    </>
  )
)}
 
      </Col>

      <Col className="d-flex gap-2">

  {/* PLUS */}
  <Button
    ref={plusRef}
    onMouseEnter={() => setTooltip(t => ({ ...t, plus: true }))}
    onMouseLeave={() => setTooltip(t => ({ ...t, plus: false }))}
    onClick={GenesOnly}
    active={variantFilters.genesOnly}
    className="filter-card-btn-gap"
  >
    <FontAwesomeIcon icon={faPlus} />
  </Button>

  <Overlay target={plusRef.current} show={tooltip.plus} placement="top">
    {(props) => (
      <Tooltip {...props}>
        Only variants that have any gene annotation
      </Tooltip>
    )}
  </Overlay>

  {/* MINUS */}
  <Button
    ref={minusRef}
    onMouseEnter={() => setTooltip(t => ({ ...t, minus: true }))}
    onMouseLeave={() => setTooltip(t => ({ ...t, minus: false }))}
    onClick={NoGene}
    active={variantFilters.noGene}
    className="filter-card-btn-gap"
  >
    <FontAwesomeIcon icon={faMinus} />
  </Button>

  <Overlay target={minusRef.current} show={tooltip.minus} placement="top">
    {(props) => (
      <Tooltip {...props}>
        Only variants that do not have gene annotation
      </Tooltip>
    )}
  </Overlay>

  {/* PEN */}
  <Button
    ref={penRef}
    onMouseEnter={() => setTooltip(t => ({ ...t, pen: true }))}
    onMouseLeave={() => setTooltip(t => ({ ...t, pen: false }))}
    onClick={EnableGeneLookup}
    active={variantFilters.geneFilter}
    className="filter-card-btn-gap"
  >
    <FontAwesomeIcon icon={faPen} />
  </Button>

  <Overlay target={penRef.current} show={tooltip.pen} placement="top">
    {(props) => (
      <Tooltip {...props}>
        Enable/disable gene name lookup
      </Tooltip>
    )}
  </Overlay>

  {/* PASTE */}
  <Button
    ref={pasteRef}
    onMouseEnter={() => setTooltip(t => ({ ...t, paste: true }))}
    onMouseLeave={() => setTooltip(t => ({ ...t, paste: false }))}
    onClick={handlePasteGene}
  >
    <FontAwesomeIcon icon={faPaste} />
  </Button>

  <Overlay target={pasteRef.current} show={tooltip.paste} placement="top">
    {(props) => (
      <Tooltip {...props}>
        Choose gene IDs
      </Tooltip>
    )}
  </Overlay>

</Col>
      </Row>
      </>
      }
    </Form>
      </Tab>
      <Tab eventKey="variantID" title="Filter by variant IDs">
        <hr className="filter-card-separator" />
        <Form>
        <Row className="gx-3 align-items-center">
      <Col xs="auto" className="text-start d-flex">
      <div className="d-flex align-items-center gap-2">

      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id="tooltip-import-variants">Import Variant IDs from file (Up to 1M)</Tooltip>
        }
      >
        <div>
          <Button as="label" variant="primary">
            <FontAwesomeIcon icon={faFileImport} />
            <input
              type="file"
              accept=".txt"
              className="filter-card-hidden-file-input"
              onChange={handleFileChange}
            />
          </Button>
        </div>
      </OverlayTrigger>
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id="tooltip-paste-variants">Paste variant IDs from clipboard </Tooltip>}
      >
      <Button onClick={handlePasteVarIds}><FontAwesomeIcon icon={faPaste} /></Button>
      </OverlayTrigger>
      {variantFilters.selectedVariantIDs.length>0 &&
           <OverlayTrigger
        placement="top"
        overlay={<Tooltip id="tooltip-copy-variants">Copy selected variant IDs to clipboard </Tooltip>}
      >
      <Button onClick={() =>{
        navigator.clipboard.writeText(variantFilters.selectedVariantIDs?.join('\n'))

      } }><FontAwesomeIcon icon={faCopy} /></Button>
      </OverlayTrigger>
      }
   </div>
      </Col>
<Col>
  <Form.Control
    disabled={variantFilters.key !== "variantID"}
    value={varIdSearch}
    onChange={(e) => setVarIdSearch(e.target.value)}
  />

  {variantFilters.key === "variantID" && (
    varIdSearch.length < 3 && variantFilters.selectedVariantIDs.length === 0 ? (
      <p>Please type more</p>
    ) : (
      <>
        {(varIdSearchRes.length > 0 && varIdSearchRes[0] !== "Too many results, please refine search!") ||
        variantFilters.selectedVariantIDs.length > 0 ? (
          <MultiSelectDropdown
            options={Array.from(
              new Set([
                ...(varIdSearchRes.length === 1 && varIdSearchRes[0] === "Too many results, please refine search!"
                  ? []
                  : varIdSearchRes ?? []),
                ...variantFilters.selectedVariantIDs,
              ])
            )}
            title='Selected variants'
            selectedOptions={variantFilters.selectedVariantIDs}
            setSelectedOptions={setSelectedVariantIDs}
          />
        ) : null}

        {varIdSearchRes.length === 1 && varIdSearchRes[0] === "Too many results, please refine search!" ? (
          <p>{varIdSearchRes[0]}</p>
        ) : varIdSearchRes.length === 0 && varIdSearch.length > 0 ? (
          <p>No options found</p>
        ) : null}
      </>
    )
  )}
</Col>

      </Row>
        </Form>
      </Tab>
      
    </Tabs>
    <hr className="filter-card-separator" />
    <Row className="align-items-center gx-1 filter-card-investigate-row">
      <Col xs="auto" className="text-start">
        <Form.Label className="mb-0">Investigate genotypes</Form.Label>
      </Col>
      <Col>
  <div
    ref={selectRef}
    onMouseEnter={() => setTooltip(t => ({ ...t, investigate: true }))}
    onMouseLeave={() => setTooltip(t => ({ ...t, investigate: false }))}
  >
    <Form.Select
      className="filter-card-select-sm"
      aria-label="Default select example"
      value={variantFilters.nbGroups}
      onChange={(o) => setGroups(o.target.value)}
    >
      <option value="0">Disabled</option>
      {Array.from({ length: 10 }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {`On ${i + 1} group` + (i === 0 ? "" : "s")}
        </option>
      ))}
    </Form.Select>
  </div>

  <Overlay target={selectRef.current} show={tooltip.investigate} placement="top">
    {(props) => (
      <Tooltip {...props}>
        Investigate genotypes (up to 10 groups)
      </Tooltip>
    )}
  </Overlay>
</Col>
    </Row>
    </div>
      </Card.Body>
      
    </Card>
    </div>
    </Collapse>
    <SavedQueriesModal
      show={showSavedQueriesManagement}
      savedQueries={savedQueries}
      onClose={handleClose}
      onLoad={handleLoadQueryById}
      onRename={() => {
        HandleSaveQuery();
      }}
      onDelete={handleDeleteQuery}
    />
     


<InputLookupModal
  show={showVarIdLookupModal}
  title="Paste Variant IDs"
  instructionText="Please paste up to 1000 variant IDs (one per line) in the box below:"
  value={VarIdLookupInputText}
  onApply={() => {
    handleApplyVarIdLookup()
  }}
  onChange={setVarIdLookupInputText}
  onCancel={() => setshowVarIdLookupModal(false)}
/>
<InputLookupModal
  show={showGeneLookupModal}
  title="Paste gene IDs"
  instructionText="Please paste up to 1000 gene IDs (one per line) in the box below:"
  value={GeneLookupInputText}
  onApply={() => {
    handleApplyGeneLookup()
  }}
  onChange={setGeneLookupInputText}
  onCancel={() => setshowGeneLookupModal(false)}
/>
    </div>
  );
};

export default FilterCard;