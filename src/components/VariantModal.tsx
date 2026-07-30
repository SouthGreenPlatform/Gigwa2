import React, { use, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Button,
  Container,
  Row,
  Table,
  Accordion,
  Col,
  Badge,
  Card,
  Tooltip,
  OverlayTrigger,
  Form,
} from "react-bootstrap";
import { useFilters } from "../contexts/Filters";
import VariantDetailsIndividualTable from "./VariantDetailsIndividualTable";
import { GROUP_COLORS, GROUP_TEXT_COLORS, GROUP_TINT_COLORS} from "../config/groupConfig";
import "../styles/variant-modal.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import QuickStats, { QuickStatsObject } from "./QuickStats";


interface callsetInfo {
  sample: string[];
  callSet: string[];
  [key: string]:unknown;
}
interface callset {
  callSetId:string;
  genotype: number[];
  genotypeLikelihood: number[];
  info: callsetInfo;
}
interface VariantDetails {
  id: string;
  variantSetId: string;
  referenceName: string;
  start: number;
  end: number;
  referenceBases: string;
  alternateBases: string[];
  info?: Record<string, any>;
  calls: any[];
}

interface VariantModalProps {
  show: boolean;
  variantDetails: VariantDetails[] | null;
  variantAnnotation: Record<string, any> | null;
  onClose: () => void;
  handleShowModal : (row, variantID) => void;
  groups: string[][];
  project: string;
  variantsIDs: string[];
  workwithSamples: boolean;
  searchableAnnotations: string[];
  headersDefinitions: Record<string,string>;
  bioEntitiesLength:Number;
}

const VariantModal: React.FC<VariantModalProps> = ({
  show,
  variantDetails,
  variantAnnotation,
  onClose,
  handleShowModal,
  variantsIDs,
  groups,
  workwithSamples,
  searchableAnnotations,
  headersDefinitions,
  bioEntitiesLength
}) => {
  const { groupFilters } = useFilters();
  const [missingDataInformation,setMissingDataInformation] = useState({})
  const [majorGenotypeByUsedId,setMajorGenotypeByUsedId] = useState({})
  const [missingDataCountGroupedByBioEntity, setMissingDataCountGroupedByBioEntity] = useState({});

  const baseVariant = variantDetails?.[0] ?? null;


const regroupedCallsById = useMemo(() => {
  if (!variantDetails) return {};

  const callsRegroupedById = {};

  variantDetails.forEach((v) => {
    if (!v?.calls) return;

    v.calls.forEach((call) => {
      const individualId = call.callSetId?.split("§")[1];
      const sampleId =  call.info.sample[0];
      const usedId = workwithSamples ? sampleId : individualId;
      if (!usedId) return;

      if (!callsRegroupedById[individualId]) {
        callsRegroupedById[individualId] = [];
      }

      callsRegroupedById[individualId].push(call);
    });
  });

  

  return callsRegroupedById;
}, [show, variantDetails]);


const allCalls = useMemo(() => {

  if (!variantDetails) return [];

  return variantDetails.flatMap((v) => {
    if (!v.calls) return [];

    // Keep only calls that have a non-empty genotype
    // const callsWithGenotype = v.calls.filter(
    //   //(call) => Array.isArray(call.genotype) && call.genotype.length > 0
    // );
    
    else return v.calls;
    
  });
}, [show, variantDetails]);


  const [headersParsed, setHeadersParsed] = useState<string[]>([]);
  const [allelicGenotypes, setAllelicGenotypes] = useState<
    { id: string; allelicGenotype: string[] }[]
  >([]);
  const [overallStats, setOverallStats] = useState<QuickStatsObject>({
      size:0,
      missingData:0,
      heterozygosity:0,
      MAF:0
    });
  const [groupStats, setGroupStats] = useState<QuickStatsObject[]>([]);
  const [displayOverall, setDisplayOverall] = useState(false);
  const [showAllCalls, setShowAllCalls] = useState(false);
  
  const [askGenotypesDisplay,setAskGenotypesDisplay] = useState(false);

  const [nextVariantIndex, setNextVariantIndex] = useState(variantsIDs.indexOf(baseVariant?.id)+1);
  const [lastVariantIndex, setLastVariantIndex] = useState(variantsIDs.indexOf(baseVariant?.id)-1);

 

  useEffect(()=>{
    setShowAllCalls(false)
  const distinctBioEntities = new Set(
    Object.values(groupFilters).flatMap(group => group.selectedIndividuals)
  );

  if (Object.keys(groupFilters).length === 0 || Object.values(groupFilters).some(group => group.selectedIndividuals.length === 0 || group.selectedIndividuals.length === bioEntitiesLength || distinctBioEntities?.size===bioEntitiesLength)) {
    setAskGenotypesDisplay(false);
  }
  else {
    setAskGenotypesDisplay(true)
  }
 
  },[show])

  useEffect(()=>{
      const distinctBioEntities = new Set(
    Object.values(groupFilters).flatMap(group => group.selectedIndividuals)
  );
    if (Object.keys(groupFilters).length === 0 || showAllCalls || distinctBioEntities?.size===bioEntitiesLength) {
      setDisplayOverall(true)
    }
    else {
      setDisplayOverall(false)
    }
  },[showAllCalls,show,groupFilters])






 function parseAndExtractAttributes(calls: any[]) {
  const baseHeaders = ["Individual", "Genotype"];
  const uniqueAttributes = new Set<string>();

  calls.forEach(call => {
    if (call.info) {
      Object.keys(call.info).forEach(attr => uniqueAttributes.add(attr));
    }
  });
  uniqueAttributes.add("project").add("run");
  return [
    ...baseHeaders,
    ...Array.from(uniqueAttributes).filter(
      attr => !baseHeaders.includes(attr)
    ),
  ];
}

  function mapGenotypesToAlleles(
    ref: string,
    alts: string[],
    samples: any[]
  ) {
    const alleleMap: Record<number, string> = { 0: ref };
    alts?.forEach((a, i) => (alleleMap[i + 1] = a));

    return samples.map(s => ({
      id: s.info.callSet[0],
      allelicGenotype: s.genotype?.map((g: number) => alleleMap[g]) || [],
    }));
  }

  function calculateGenotypeStats(majorGenotypeByUsedId: Record<string, string | null>) {
  const usedIds = Object.keys(majorGenotypeByUsedId);
  if (!usedIds.length) return { size:0, MAF: 0, heterozygosity: 0, missingData: 0 };

  const alleleCounts: Record<string, number> = {};
  let total = 0;
  let het = 0;
  let missing = usedIds.filter(id => missingDataCountGroupedByBioEntity[id]).length;

  usedIds.forEach(usedId => {
    const gt = majorGenotypeByUsedId[usedId];
    if (!gt || missingDataCountGroupedByBioEntity[usedId]) {
      return; // if considered missing we do not do anything
    }
    const alleles = gt.split("/");
    if (new Set(alleles).size > 1) het++;
    alleles.forEach(a => {
      alleleCounts[a] = (alleleCounts[a] || 0) + 1;
      total++;
    });
  });

  const freqs = Object.values(alleleCounts).map(c => c / total);
  const maf = freqs.length > 1 ? Math.min(...freqs) : 0;
  const round = (v: number) => Math.ceil(v * 10000) / 100;

  return {
    size: usedIds.length,
    MAF: round(maf),
    heterozygosity: round(het / (usedIds.length - missing || 1)),
    missingData: round(missing / usedIds.length),
  };
}

  function getGroupsForId(id: string) {
    const res: number[] = [];
    groups.forEach((g, i) => {
      if (g.length === 0 || g.includes(id)) res.push(i);
    });
    return res;
  }

  function generateBackgroundStyle(indices: number[]) {
    if (!indices.length) return {};
    if (indices.length === 1)
      return { backgroundColor: GROUP_COLORS[indices[0] % GROUP_COLORS.length] };

    const step = 100 / indices.length;
    return {
      background: `linear-gradient(to right, ${indices
        .map(
          (i, k) =>
            `${GROUP_COLORS[i % GROUP_COLORS.length]} ${k * step}% ${
              (k + 1) * step
            }%`
        )
        .join(",")})`,
    };
  }

  function noUniqueMostFrequent(arr) {
  const freq = {};
  let max = 0;

  
  for (const num of arr) {
    freq[num] = (freq[num] || 0) + 1;
    if (freq[num] > max) max = freq[num];
  }

  
  let countMax = 0;
  for (const key in freq) {
    if (freq[key] === max) {
      countMax++;
      if (countMax > 1) return true; 
    }
  }

  return false; 
}

  function calculateMissingData(searchableAnnotations: Array<string>, regroupedCallsById: Record<string, Array<callset>>) {
  let missingDataCountGroupedByBioEntity: Record<string, boolean> = {};

  const passesFilter = (callset: any): boolean => {
    return searchableAnnotations.every((annotation) =>
      Object.keys(groupFilters).every((key) => {
        const selectedIndividuals = groupFilters[key]?.selectedIndividuals || [];
        const filterValue = groupFilters[key]?.searchableAnnotationsFilter?.[annotation] || 0;
        const infoValue = callset.info?.[annotation] || 0;
        if (
          (selectedIndividuals.length === 0 ||
            selectedIndividuals.some((el) => el.includes(`§${callset.callSetId}`))) &&
          filterValue > infoValue
        ) return false;
        return true;
      })
    );
  };

  // Build frequency only from callsets that pass the filter
  const genotypesByUsedId: Record<string, string[]> = {};
  Object.entries(regroupedCallsById).forEach(([_, callsetsData]) => {
    callsetsData.forEach((callset) => {
      const usedId = !workwithSamples
        ? callset.callSetId.split("§")[1]
        : callset.info.sample[0];
      const genotype = callset.genotype?.length ? callset.genotype.join("/") : null;
      if (!genotypesByUsedId[usedId]) genotypesByUsedId[usedId] = [];
      if (genotype && passesFilter(callset)) genotypesByUsedId[usedId].push(genotype); // <-- only if filter passes
    });
  });

  // null = no major genotype (tie), string = major genotype
  const majorGenotypeByUsedId: Record<string, string | null> = {};
  Object.entries(genotypesByUsedId).forEach(([usedId, genotypes]) => {
    const freq: Record<string, number> = {};
    let max = 0;
    let maxCount = 0;
    genotypes.forEach((g) => {
      freq[g] = (freq[g] || 0) + 1;
      if (freq[g] > max) { max = freq[g]; maxCount = 1; }
      else if (freq[g] === max) { maxCount++; }
    });
    majorGenotypeByUsedId[usedId] = maxCount === 1
      ? Object.keys(freq).find((g) => freq[g] === max)!
      : null;
  });

  /* Conditions to consider data as missing are :
    1. No genotype present OR
    2. No major genotype present (tie or all filtered out) OR
    3. The major genotype's callset didn't pass the filter
  */
  let missingDataInformation = {};
  Object.entries(regroupedCallsById).forEach(([_, callsetsData]) => {
    let isBioEntityMissing = false;
    const usedIdforMissingCounts = !workwithSamples
      ? callsetsData?.[0]?.callSetId?.split("§")?.[1]
      : callsetsData?.[0]?.info.sample[0];

    callsetsData.forEach((callset) => {
      const usedId = !workwithSamples
        ? callset.callSetId.split("§")[1]
        : callset.info.sample[0];

      const majorGenotype = majorGenotypeByUsedId[usedId];
      const noMajorPassesFilter = majorGenotype !== null && !callsetsData.some(
        (cs) => cs.genotype?.join("/") === majorGenotype && passesFilter(cs)
      );
      const noGenotype = !callset.genotype?.length;
      const noMajorGenotype = majorGenotype === null;
      const isThisMajorCallset = callset.genotype?.join("/") === majorGenotype;
      const majorDidNotPassFilter = isThisMajorCallset && !passesFilter(callset);

      let headersConcernedByMissingData = [];
      if (noGenotype || noMajorGenotype) headersConcernedByMissingData.push("Genotype");

      // collect filter failures per annotation for display purposes
      searchableAnnotations.forEach((annotation) => {
        Object.keys(groupFilters).forEach((key) => {
          const selectedIndividuals = groupFilters[key]?.selectedIndividuals || [];
          const filterValue = groupFilters[key]?.searchableAnnotationsFilter?.[annotation] || 0;
          const infoValue = callset.info?.[annotation] || 0;
          if (
            (selectedIndividuals.length === 0 ||
              selectedIndividuals.some((el) => el.includes(`§${callset.callSetId}`))) &&
            filterValue > infoValue
          ) {
            headersConcernedByMissingData.push(annotation);
          }
        });
      });

      if (noGenotype || noMajorGenotype || noMajorPassesFilter) {
        isBioEntityMissing = true; // <-- only true if major genotype is the problem
      }

      if (headersConcernedByMissingData.length) {
        if (!missingDataInformation[callset.info.callSet[0]])
          missingDataInformation[callset.info.callSet[0]] = [];
        missingDataInformation[callset.info.callSet[0]].push(...headersConcernedByMissingData);
      }
    });

    missingDataCountGroupedByBioEntity[usedIdforMissingCounts] = isBioEntityMissing;
  });
  setMissingDataCountGroupedByBioEntity(missingDataCountGroupedByBioEntity);
  setMissingDataInformation(missingDataInformation);
  setMajorGenotypeByUsedId(majorGenotypeByUsedId);
  return missingDataInformation;
}

  const handleShowAllCallsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAllCalls(e.target.checked);
  };

  useEffect(() => {
    if (!baseVariant) {
      console.error("base variant not defined!")
      return;
    }
    
    setNextVariantIndex(variantsIDs.indexOf(baseVariant?.id)+1);
    setLastVariantIndex(variantsIDs.indexOf(baseVariant?.id)-1)

    setHeadersParsed(parseAndExtractAttributes(allCalls));
    setAllelicGenotypes(
      mapGenotypesToAlleles(
        baseVariant.referenceBases,
        baseVariant.alternateBases,
        allCalls
      )
    );
    calculateMissingData(searchableAnnotations,regroupedCallsById)
    

  }, [baseVariant, allCalls, groups
  ]);

  useEffect(()=>{
    let majorGenotypeByUsedIdForOverallStats = majorGenotypeByUsedId;
    const allGroupEntities = new Set(groups.flat());
    if (!showAllCalls && askGenotypesDisplay) {
      const overallSubset = Object.fromEntries(
        Object.entries(majorGenotypeByUsedIdForOverallStats).filter(
          ([bioEntity]) => allGroupEntities.has(bioEntity)
        )
      );
      majorGenotypeByUsedIdForOverallStats = overallSubset;
    }

    setOverallStats(calculateGenotypeStats(majorGenotypeByUsedIdForOverallStats));
    setGroupStats(
        groups.map(g => {
          const subset =
            g.length === 0
              ? majorGenotypeByUsedId
              : Object.fromEntries(/*  */
                  Object.entries(majorGenotypeByUsedId).filter(([bioEntity]) =>
                    g.includes(bioEntity)
                  )
                );

          return calculateGenotypeStats(subset);
        })
    );

  },[majorGenotypeByUsedId,missingDataCountGroupedByBioEntity, showAllCalls])

  return (
    <Modal show={show} onHide={onClose} fullscreen centered>
      <Modal.Header closeButton>
        <Row>
          <Col>
            <h2><Badge bg="success">Variant Details</Badge></h2>
          </Col>
          <Col>
              { 

          <div id="variantDetailsNavigation">
              <Button variant="outline-secondary" size="sm" className="variantModal-nav-btn"
                  onClick={() => {
                    handleShowModal(null, variantsIDs[lastVariantIndex])
                  }} 
                  
                  disabled={lastVariantIndex < 0} title="Previous variant">
                <FontAwesomeIcon icon={faChevronLeft} />
              </Button>
              <span className="variantModal-nav-range">

                {nextVariantIndex}
                <span className="variantModal-nav-total"> / {variantsIDs.length}</span>

              </span>
              <Button variant="outline-secondary" size="sm" className="variantModal-nav-btn" 
                  
                  onClick={() => {
                    handleShowModal(null, variantsIDs[nextVariantIndex])
                  }}
        
                  disabled={nextVariantIndex >= variantsIDs.length} title="Next variant">
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
          </div>

        }
          </Col>
        </Row>
      </Modal.Header>

      <Modal.Body>
        <Container fluid>
                    {baseVariant && (
<Row className="mb-2">
  <Col>
    <Card className="p-3 border-0 shadow-sm">
      <Row className="g-2 align-items-center" >

        <Col md="auto" className="fw-semibold">Variant:</Col>
        <Col>{baseVariant.id.split("§")[1]}</Col>

        <Col md="auto" className="fw-semibold">Sequence:</Col>
        <Col>{baseVariant.referenceName}</Col>

        <Col md="auto" className="fw-semibold">Position:</Col>
        <Col>
          {baseVariant.start} - {baseVariant.end}
        </Col>

        <Col md="auto" className="fw-semibold">Type:</Col>
        <Col>{baseVariant?.info?.type}</Col>

        <Col md="auto" className="fw-semibold">Alleles:</Col>
        <Col>
          <span className="fw-semibold" >{baseVariant.referenceBases}</span>
          {baseVariant.alternateBases?.length > 0 &&
            <>
              <span className="mx-1">→</span>
              <span >{baseVariant.alternateBases.join(",")}</span>
            </>

          }
          
        </Col>

      </Row>
    </Card>
  </Col>
</Row>
          )}
          <Row>
                      <Accordion defaultActiveKey={["0", "1"]} alwaysOpen>
                        {variantAnnotation?.info?.meta_header?.length > 0 && (
                          <Accordion.Item className="mb-2" eventKey="0">
                            <Accordion.Header className="bg-dark text-white">
                              Variant Metadata
                            </Accordion.Header>

                            <Accordion.Body>
                              <div className="variant-modal-table-scroll">
                                <Table bordered hover className="w-100">

                                  <thead>
                                    <tr>
                                      <th>project</th>
                                      <th>run</th>

                                      {variantAnnotation.info.meta_header.map((h, index) => (
                                        <OverlayTrigger
                                          key={index}
                                          placement="top"
                                          overlay={
                                            <Tooltip id={`tooltip-${index}`}>
                                              {headersDefinitions[h] || h}
                                            </Tooltip>
                                          }
                                        >
                                          <th>{h}</th>
                                        </OverlayTrigger>
                                      ))}
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {Object.keys(variantAnnotation.info)
                                      .filter((key) => key.startsWith("meta_values_"))
                                      .map((key, rowIndex) => {

                                        const parts = key.replace("meta_values_", "").split("_");
                                        const projectName = parts[0];
                                        const runName = parts.slice(1).join("_");

                                        const values = variantAnnotation.info[key];

                                        return (
                                          <tr key={rowIndex}>
                                            <td>{projectName}</td>
                                            <td>{runName}</td>

                                            {values.map((v, i) => (
                                              <td key={i}>{v}</td>
                                            ))}
                                          </tr>
                                        );
                                      })}
                                  </tbody>

                                </Table>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        )}
          
                        {variantAnnotation?.info?.ann_header?.length > 0 && (
                          <Accordion.Item className="mb-3" eventKey="1">
                            <Accordion.Header>Functional Annotations</Accordion.Header>
                            <Accordion.Body>
                               <div className="variant-modal-table-scroll">
                              <Table bordered hover className="w-100">
                                <thead>
                                  <tr>
                                    {variantAnnotation?.info?.ann_header?.map(
                                      (h, index) => (
                                        <th key={index}>{h}</th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.keys(variantAnnotation?.info || {})
                                    .filter((key) => key.startsWith("ann_values_"))
                                    .map((annKey, rowIndex) => (
                                      <tr key={rowIndex}>
                                        {variantAnnotation?.info[annKey]?.map(
                                          (value, colIndex) => (
                                            <td key={colIndex}>{value}</td>
                                          )
                                        )}
                                      </tr>
                                    ))}
                                </tbody>
                              </Table>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        )}
                      </Accordion>
                    </Row>
                    <Accordion defaultActiveKey={["0"]} alwaysOpen className="no-spacing">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Quick variant stats</Accordion.Header>
                        <Accordion.Body>
                          {/* Combined Genotype Stats */}
                      <Row className="g-4"> {/* g-4 adds spacing between cards */}
                          { true &&
                          <>
                            <QuickStats title="Overall figures" stats={overallStats}/>
                          </>
                          }

                        {/* Grouped Stats Cards */}
                        {groupStats.map((group, index) => {
                          return (
                            <>
                            <QuickStats
                                stats={group}
                                title={groupFilters[index + 1]?.name || `Group${index + 1}`}
                                cardClassName="variant-modal-group-card"
                                cardStyle={{
                                  "--group-color": GROUP_COLORS[index % GROUP_COLORS.length],
                                  "--group-tint": GROUP_TINT_COLORS[index % GROUP_TINT_COLORS.length],
                                  "--group-text": GROUP_TEXT_COLORS[index % GROUP_TEXT_COLORS.length],
                                } as React.CSSProperties}
                                cardHeaderClassName="variant-modal-group-header"
                              />
                            </>
                          );
                        })}
                      </Row>
                        </Accordion.Body>
                        
                      </Accordion.Item>
                      
                    </Accordion>

          <Row className="mt-3">
            <Col>
            <Row>
                    {askGenotypesDisplay &&
                    <Form.Check
                      type="checkbox"
                      className="mb-2"
                      label="Show all individuals (ignore group filtering)"
                      checked={showAllCalls}
                      onChange={handleShowAllCallsChange}
                    />
                    }
            </Row>
<Row>
  <Col>
    <VariantDetailsIndividualTable
      show={show}
      calls={allCalls}
      headersParsed={headersParsed}
      allelicGenotypes={allelicGenotypes}
      referenceBases={baseVariant.referenceBases}
      groups={groups}
      groupFilters={groupFilters}
      getGroupsForId={getGroupsForId}
      generateBackgroundStyle={generateBackgroundStyle}
      workwithSamples={workwithSamples}
      missingDataInformation={missingDataInformation}
      regroupedCallsById={regroupedCallsById}
      showAllCalls={showAllCalls}
      askGenotypesDisplay={askGenotypesDisplay}
    />
  </Col>
</Row>

            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  );
};

export default VariantModal;
