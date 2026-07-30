

import React from "react"
import { useEffect, useState } from "react"
import "../styles/individual-card.scss"
import { useFilters } from "../contexts/Filters"
import { InputGroup, Row, Col, OverlayTrigger, Tooltip, Overlay } from "react-bootstrap"
import Button from "react-bootstrap/Button"
import Card from "react-bootstrap/Card"
import MultiSelectDropdown from "./MultiSelect"
import Form from "react-bootstrap/Form"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPaste, faLessThanEqual, faCopy, faSearch, faSave, faTrash, faArrowUp, faArrowDown, faChevronUp, faPercentage } from "@fortawesome/free-solid-svg-icons"
import MetadataModal from "./MetadataModal"
import InputLookupModal from "./InputLookupModal"
import { useParams } from "react-router-dom"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown"
import { GROUP_COLORS, GROUP_TEXT_COLORS, GROUP_TINT_COLORS } from "../config/groupConfig";
import IndividualCardRangeFilter from "./IndividualCardRangeFilter"
// Define the props interface
interface IndividualProps {
  title?: string
  groupID: number
  individualsNames?: Array<string>
  individualsIDs?: Array<string>
  distinctMetadata?: Object
  searchableAnnotations?: Array<string>
  genotypePatterns?: Record<string,string>
  workWithSamples?: boolean
  onDelete?: () => void
}

// Create the functional component
const IndividualCard: React.FC<IndividualProps> = ({
  title = "Default Title",
  individualsNames = [],
  individualsIDs = [],
  searchableAnnotations = [],
  genotypePatterns = [],
  distinctMetadata={},
  groupID = 1,
  workWithSamples=false,
  onDelete,
}) => {
  const [groupName, setGroupName] = useState(`Group${groupID}`);
  const { taxon, dbOrProjects, assembly, project } = useParams();
  useEffect(() => {
    console.log("changed selection")
  }, [individualsNames, searchableAnnotations, genotypePatterns])
  const [currentGTpatterns,setCurrentGTpatterns] = useState(genotypePatterns);
  
  // const individuals_ = ["ind1", "ind2", "ind3"]
  const {
    variantFilters,
    groupFilters,
    setDiscriminateGroups,
    setSearchableAnnotationsFilter,
    setGenotypePattern,
    setMostSameRatio,
    setHeterozygosity,
    setMaf,
    setMissing,
    setSelectedIndividuals,
    deleteGroup,
    setName,
  } = useFilters()

  const updateGTpatterns = (selectedInd) =>{
    setCurrentGTpatterns({});
    const newGTs={};
    const toDistinct = "all";
    if (selectedInd.length===1){
      Object.keys(genotypePatterns).map(gt=>{
         if (!gt.toLowerCase().includes(toDistinct) || gt=="Any"){
          newGTs[gt]=genotypePatterns[gt]
         }
      }
      )
      setCurrentGTpatterns(newGTs)
    }
    else{
      setCurrentGTpatterns(genotypePatterns)
    }

  }
  useEffect(()=>{
    updateGTpatterns(groupFilters[groupID].selectedIndividuals);
    
  },[groupFilters[groupID].selectedIndividuals])
  useEffect(() => {
    console.log("From individual component: ", variantFilters.nbGroups)
  }, [variantFilters])
   const [showMetadataModal, setShowMetadataModal] = useState(false);
     const handleCloseMetadataModal = () => {
    setShowMetadataModal(false);
  };
   const handleOpenMetadataModal = () => {
  

    setShowMetadataModal(true);
  };
  useEffect(()=>{
    setName(groupID.toString(),groupName)
  },[groupName])


  const [showIndividualPasteModal,setShowIndividualPasteModal] = useState(false)
  const [individualPasteInput,setIndividualPasteInput] = useState("")
  const handleApplyIndividualIds = () => {
  let acceptedSelection = [];
  individualPasteInput.split('\n').map((individual)=>{
    let individualFormated = ""
    if (workWithSamples){
      individualFormated = `${dbOrProjects.split('§')[0]}§${dbOrProjects?.split(",").map(item => item.split("§")[1]).join(",")}§${individual}`;
      console.log(individualFormated)
    }
    else {
     individualFormated =  `${dbOrProjects.split('§')[0]}§${individual}`;
     console.log(individualFormated)
    }
    
    if (individualsIDs.includes(`${individualFormated}`) && !acceptedSelection.includes(individual)){
      acceptedSelection.push(individual)
    }

  })
 setSelectedIndividuals(groupID.toString(),acceptedSelection)
  setShowIndividualPasteModal(false);
};
const [selectedGenotypePattern, setSelectedGenotypePattern] = useState("");
const [currentProjects, setCurrentProjects] = useState("")
const [storageKey, setStorageKey] = useState(dbOrProjects?.split("§")[1]);
useEffect(()=>{
  setCurrentProjects(dbOrProjects);
},[dbOrProjects])
useEffect(()=>{
  setStorageKey(currentProjects ? `groupMemorizer${groupID}::${currentProjects}` : "");

},[currentProjects])


  
  const currentSelection = groupFilters[groupID]?.selectedIndividuals || [];
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!storageKey) {
      setIsSaved(false);
      return;
    }
    setIsSaved(localStorage.getItem(storageKey) !== null);
  }, [storageKey, variantFilters.nbGroups]);

  const handleToggleSave = () => {
    console.log(storageKey)
    if (!storageKey) {
      return;
    }

    if (isSaved) {
      localStorage.removeItem(storageKey);
      setIsSaved(false);
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(currentSelection));
    setIsSaved(true);
  };

  useEffect(() => {
    if (!isSaved || !storageKey) {
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(currentSelection));
  }, [isSaved, storageKey, currentSelection])

  const [hideCard,setHideCard] = useState(false)

  function hideMe(): void {
    setHideCard(!hideCard)
  }
  const saveRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const copyRef = React.useRef(null);
  const pasteRef = React.useRef(null);

  const [tooltip, setTooltip] = React.useState({
    save: false,
    search: false,
    copy: false,
    paste: false,
  });

  return (
    <div
      className={`filter-individuals individual-card`}
      style={{
        ["--group-bg" as string]: GROUP_COLORS[(groupID - 1) % GROUP_COLORS.length],
        ["--group-text" as string]: GROUP_TEXT_COLORS[(groupID - 1) % GROUP_TEXT_COLORS.length],
        ["--group-tint" as string]: GROUP_TINT_COLORS[(groupID - 1) % GROUP_TINT_COLORS.length],
      }}
    >
      <Card className="p-0 m-0 fw-bold individual-card-shell">
        <Card.Header className="m-0 p-2 individual-card-header">
          <input
            type="text"
            className="individual-card-name-input"
            maxLength={12}
            id={`groupLabel${groupID}`}
            value={groupFilters[groupID].name}
            onChange={(e) => setName(groupID.toString(), e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (!val) {
                setName(groupID.toString(), `Group${groupID}`);
              }
            }}
          />
          <Button
            className="individual-card-btn-transparent"
            size="sm"
            onClick={() => { if (onDelete) { onDelete(); return; } deleteGroup(groupID.toString()) }}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
          <Button className="individual-card-toggle-btn ms-auto" onClick={hideMe}>
            <FontAwesomeIcon icon={hideCard ? faChevronDown : faChevronUp} />
          </Button>
        </Card.Header>
{!hideCard &&
        <Card.Body className="m-2 p-0 mt-1">
                  <div 
      className="p-0 m-0" >
          <Form>
                  <Row className="align-items-center mt-1 gx-2">
                    
            

                <Col xs={8} sm={8} md={8}>
                <MultiSelectDropdown
                  options={individualsNames}
                  enableLookup
                  selectedOptions={groupFilters[groupID]?.selectedIndividuals || []}
                  setSelectedOptions={setSelectedIndividuals}
                  groupID={groupID.toString()}
                  title={!workWithSamples?"Individuals":"Samples"}
                />
              </Col>
              <Col className="d-flex justify-content-end align-items-center p-0 m-0">

              {/* SAVE */}
              <Button
                ref={saveRef}
                className={`individual-card-icon-btn${isSaved ? " individual-card-icon-btn-saved" : ""}`}
                active={isSaved}
                onClick={handleToggleSave}
                onMouseEnter={() => setTooltip(t => ({ ...t, save: true }))}
                onMouseLeave={() => setTooltip(t => ({ ...t, save: false }))}
              >
                <FontAwesomeIcon icon={faSave} />
              </Button>

              <Overlay target={saveRef.current} show={tooltip.save} placement="top">
                {(props) => (
                  <Tooltip {...props}>
                    {isSaved ? "Forget saved selection" : "Memorize selection in browser"}
                  </Tooltip>
                )}
              </Overlay>

              {/* SEARCH / METADATA */}
              {Object.keys(distinctMetadata)?.length > 0 && (
                <>
                  <Button
                    ref={searchRef}
                    className="individual-card-icon-btn"
                    onClick={handleOpenMetadataModal}
                    onMouseEnter={() => setTooltip(t => ({ ...t, search: true }))}
                    onMouseLeave={() => setTooltip(t => ({ ...t, search: false }))}
                  >
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>

                  <Overlay target={searchRef.current} show={tooltip.search} placement="top">
                    {(props) => (
                      <Tooltip {...props}>
                        Open metadata table to filter
                      </Tooltip>
                    )}
                  </Overlay>
                </>
              )}

              {/* COPY */}
              <Button
                ref={copyRef}
                className="individual-card-icon-btn"
                onClick={() => {
                  groupFilters[groupID].selectedIndividuals?.length !== 0
                    ? navigator.clipboard.writeText(groupFilters[groupID].selectedIndividuals?.join("\n"))
                    : navigator.clipboard.writeText(individualsNames.join("\n"));
                }}
                onMouseEnter={() => setTooltip(t => ({ ...t, copy: true }))}
                onMouseLeave={() => setTooltip(t => ({ ...t, copy: false }))}
              >
                <FontAwesomeIcon icon={faCopy} />
              </Button>

              <Overlay target={copyRef.current} show={tooltip.copy} placement="top">
                {(props) => (
                  <Tooltip {...props}>
                    Copy current selection to clipboard
                  </Tooltip>
                )}
              </Overlay>

              {/* PASTE */}
              <Button
                ref={pasteRef}
                className="individual-card-icon-btn"
                onClick={() => setShowIndividualPasteModal(true)}
                onMouseEnter={() => setTooltip(t => ({ ...t, paste: true }))}
                onMouseLeave={() => setTooltip(t => ({ ...t, paste: false }))}
              >
                <FontAwesomeIcon icon={faPaste} />
              </Button>

              <Overlay target={pasteRef.current} show={tooltip.paste} placement="top">
                {(props) => (
                  <Tooltip {...props}>
                    Paste individual IDs
                  </Tooltip>
                )}
              </Overlay>

            </Col>
            </Row>
<hr className="individual-card-separator" />
            {searchableAnnotations.length > 0 && (
              <>
              <Row className="align-items-center">
                <Form.Label>Set minimum per sample</Form.Label>
                {searchableAnnotations.map((annotation, index) => (
                  <Col key={index}>
                    <InputGroup className="mb-1">
                      <InputGroup.Text className="individual-card-group-badge">{annotation}</InputGroup.Text>
                      <Form.Control
                        className="individual-card-control-sm"
                        value={groupFilters[groupID]?.searchableAnnotationsFilter?.[annotation] || ""}
                        onChange={(e) => {
                          // UPDATED: Now uses the fixed function with annotation key
                          setSearchableAnnotationsFilter(groupID.toString(), annotation, Number(e.target.value))
                        }}
                      />
                    </InputGroup>
                  </Col>
                ))}
              </Row>
              <hr className="individual-card-separator" />
            </>
            )}

            <IndividualCardRangeFilter label="Missing" filterKey="missing" groupID={groupID} groupFilters={groupFilters} setter={setMissing} />
            <IndividualCardRangeFilter label="MAF"     filterKey="maf"     groupID={groupID} groupFilters={groupFilters} setter={setMaf}     defaultMax={50} />
            <IndividualCardRangeFilter label="HeteroZ" filterKey="heterozygosity" groupID={groupID} groupFilters={groupFilters} setter={setHeterozygosity} />
            
            
            <hr className="individual-card-separator" />
            <Row className="align-items-center">
              <Col xs="auto">
                <Form.Label className="mb-1 individual-card-pattern-label">Genotype patterns:</Form.Label>
              </Col>
              <Col>
                <Form.Select
                  className="individual-card-select-sm individual-card-select-grouped mb-1"
                  value={groupFilters[groupID].genotypePattern || ""}
                  onChange={(e) => setGenotypePattern(groupID.toString(), e.target.value)}
                >
                  <option value="" disabled>Select an option</option>
                  {Object.keys(currentGTpatterns).map((key, index) => (
                    <option key={index} value={key} title={currentGTpatterns[key]}>{key}</option>
                  ))}
                </Form.Select>
              </Col>
              
            </Row>
            {
                groupFilters[groupID].genotypePattern==="All or mostly the same" && 
              <Row className="align-items-center">
                <Col xs="auto" >
                  <Form.Label className="mb-0 individual-card-pattern-label">Similarity ratio:</Form.Label>
                </Col>
                <Col xs="1" md="4"></Col>
                <Col>
                <InputGroup className="mb-0">
                
                  <Form.Control className="individual-card-select-sm" type="text" value={groupFilters[groupID].mostSameRatio} onChange={(e) => setMostSameRatio(groupID.toString(), e.target.value)}/>
                    <InputGroup.Text className="individual-card-group-badge">
                    <FontAwesomeIcon icon={faPercentage}/>
                  </InputGroup.Text>
                    </InputGroup>
                </Col>
              
              </Row>
              }
<hr className="individual-card-separator" />
            {variantFilters.nbGroups > 1 && (
<Row className="align-items-center">
  <Col xs="auto">
    <Form.Label className="mb-0">Discriminate with</Form.Label>
  </Col>
  <Col>
    <Form.Select
      className="individual-card-select-sm"
      aria-label="Default select example"
      onChange={(o) => {
        setDiscriminateGroups(groupID.toString(), o.target.value);
      }}
    >
      <option value="none">None</option>
      {Object.keys(groupFilters)
        .filter((key) => key !== `${groupID}`)
        .map((key) => (
          <option key={key} value={key}>
            {groupFilters[key]?.name || `Group ${key}`}
          </option>
        ))}
    </Form.Select>
  </Col>
</Row>
            )}
          </Form>
          </div>
        </Card.Body>
}
      </Card>
      {showMetadataModal && (
        <MetadataModal
          show={showMetadataModal}
          onClose={handleCloseMetadataModal}
          individuals={individualsIDs}
          distinctMetadata={distinctMetadata}
          groupID={groupID}
          workWithSamples={workWithSamples}
        />
      )}
      <InputLookupModal
      show={showIndividualPasteModal}
      title="Paste Individual IDs"
      instructionText="Please paste your individual selection (one per line) in the box below:"
      value={individualPasteInput}
      onChange={setIndividualPasteInput}
      onApply={() => {
        handleApplyIndividualIds()
      }}
      onCancel={() => setShowIndividualPasteModal(false)}
    />
    </div>
  )
}

export default IndividualCard
