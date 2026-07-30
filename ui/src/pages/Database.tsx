import { useEffect, useState } from 'react';
import endpoints from '../endpoints';
import { useParams } from 'react-router-dom';
import { Form,Button, Modal, Table  } from 'react-bootstrap';
import FilterCard from '../components/FilterCard';
import FullModal from "../components/FullModal";
import DatasetSelection from "./DatasetSelection";
import IGVBrowser from "../components/IGVBrowser";
import { useFullModal } from "../hooks/useFullModal";
import { FiltersProvider } from "../contexts/Filters";
import { useApi } from "../contexts/Authentication.tsx";
import "../styles/database.scss";

function Database() {
  const { taxon, database, project, assembly } = useParams();
  const [vartypes,setVartypes] = useState([]);
  const [nballeles,setNballeles] = useState([]);
  const [refs,setRefs] = useState([]);
  const [vareffects,setVareffects] = useState([]);
  const [individuals,setIndividuals] = useState([]);
//   const [projects,setProjects] = useState([]);
  const [searchableannotations,setSearchableannotations] = useState([]);
  const [metadata,setMetadata] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const [searchVar,setSearchVar] = useState(false);
  const [variantsSearch, setVariantsSearch] = useState({variants:[]})
  const [ploidyLevel, setPloidyLevel] = useState(null)
  const api = useApi();

  const getAssembly = () => {
    return assembly;
  }

  const getNumericProjectId = () => {
    return project ? parseInt(project.split("§")[1]) : 0;
  }
  
 const fetchVariantTypes = async () => {

  const varTypes = await api.get(`${endpoints.VARIANT_TYPES_URL}/${project}`, {
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    }
});
  
  let types = varTypes.data;
  setVartypes(types);
  console.log("got types", types)
  
 }
 const fetchVariantEffects= async () => {

  const varEffects = await api.get(`${endpoints.VARIANT_EFFECTS_URL}/${project}`, {
        headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
        }
    });
  
  let effects = varEffects.data;
  setVareffects(effects.effectAnnotations);
  console.log(effects.effectAnnotations)
  
 }

 const [loading, setLoading] = useState(false);
 
 const fetchIndividuals = async () => {
  const Individuals = await api.post(`${endpoints.INDIVIDUALS_URL}`,
    {"variantSetId":project,"name":null,"pageSize":null,"pageToken":null},
    {
        headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
        }
        
    });
  
    let ind = Individuals.data;
    setIndividuals(ind.callSets); 
    console.log("individuals: ", ind.callSets);
 }

 const fetchPloidyLevel = async () => {
    try {
        const PloidyLevel = await api.get(`${endpoints.PLOIDY_LEVEL_URL}/${project}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                }
            }
        )
        console.log("got ploidy level: ", PloidyLevel.data)
        setPloidyLevel(PloidyLevel.data)
    }
    catch (err){
        console.error(err)
    }
 }
 const fetchNballeles = async () => {

const nbAlleles = await api.get(`${endpoints.NUMBER_ALLELES_URL}/${project}`, {
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    }
});
  
  let alleles = nbAlleles.data;
  setNballeles(alleles.numberOfAllele);
  console.log(alleles.numberOfAllele)
  
 }

const fetchReferences = async () => {
const references = await api.post(`${endpoints.SEQUENCES_URL}`,
    {
        "referenceSetDbIds":[getAssembly()]
    },
    {
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    }
});

let ref = references.data;
setRefs(ref.result.data);
console.log("References: ", ref)
}

//  const fetchProjects = async () => {
//     console.log("fetching database projects with url: " ,endpoints.DATABASE_PROJECTS_URL )
//   const projects = await api.post(`${endpoints.DATABASE_PROJECTS_URL}`,
//     {
//       "datasetId":database,"pageSize":null,"pageToken":null
//  },
//     {
//     headers: {
//         'Content-Type': 'application/json',
//         accept: 'application/json',
//     }
    
// });
  
//   let proj = projects.data;
//   setProjects(proj.variantSets);
//   console.log("Projects: ", proj)

//  }

 const fetchSearchableAnnotations = async () => {
  const annotationsSearchable = await api.get(`${endpoints.SEARCHABLE_FIELDS_URL}/${project}`,
    
    {
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    }
    
});
  
  let annot = annotationsSearchable.data;
  console.log("Got searchable annotations: ", annot)
  setSearchableannotations(annot);
  console.log("annotations ", annot)

 }

const fetchMetadata = async () => {
    try {
        const Metadata = await api.post(`${endpoints.DATABASE_METADATA_URL}/${database}?projID=${getNumericProjectId()}`,
            {"Accession Name":[],"Species or Group":[],"Country of Origin":[],"DOI":[],"Sub-species or Sub-group":[]},
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    'assembly': getAssembly(),
                }  
            }
        );
        console.log("Got metadata from server: ", Metadata.data)
        setMetadata(Metadata.data)
    }
    catch (err){
        console.log(err);

    }
}

const fetchVariantsSearch = async () => {
    setLoading(true);
    try {
        const VariantsSearch = await api.post(`${endpoints.VARIANTS_SEARCH_URL}`,
            {"variantSetId":project,
                "searchMode":3,
                "getGT":false,
                "referenceName":"",  // if selection then give this a string containing list of reference names seperated with ; (e.g. "ref1;ref2;ref3") else empty.
                "selectedVariantTypes":"",
                "alleleCount":"",
                "start":-1, "end":-1,
                "variantEffect":"",
                "geneName":"",
                "callSetIds":[],
                "discriminate":[],
                "groupName":[],
                "pageSize":100,
                "pageToken":"0", // if search with pagination give this current page minus or plus one.  
                "sortBy":"",
                "sortDir":"asc",
                "selectedVariantIds":"",
                "gtPattern":[],
                "mostSameRatio":[],
                "minMaf":[],
                "maxMaf":[],
                "minMissingData":[],
                "maxMissingData":[],
                "minHeZ":[],
                "maxHeZ":[],
                "annotationFieldThresholds":[],
                "additionalCallSetIds":[]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    assembly:getAssembly()
                }
            }
        );
        setVariantsSearch(VariantsSearch.data);
        console.log("Got variants: ", VariantsSearch.data.count);
        setLoading(false);
        return VariantsSearch.data;
    }
    catch (err){
        setLoading(false);
        return err;
    }
}
const fetchVariantDetails = async (id) => {
    try {
        const VartiantDetails = await api.post(`${endpoints.VARIANT_DETAILS_GENOTYPES_URL}/${id}`,
            {"callSetIds":[]},
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    assembly:getAssembly()
                }
            }
        )
        return VartiantDetails.data;
    }
    catch (err){
        console.error(err);

    }
}
const fetchVariantAnnotations = async (id) => {
    try {
        const VartiantAnnotations = await api.get(`${endpoints.VARIANT_ANNOTATIONS_URL}/${id}`,
            
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    assembly:getAssembly()
                }
            }
        )
        return VartiantAnnotations.data;
    }
    catch (err){
        console.error(err);

    }
}
const showVariantDetails = async (id) => {
    console.log("searching details for variant: ", id);
    const VariantDetails = await fetchVariantDetails(id);
    console.log(VariantDetails);
    console.log("Searching for variant's annotations: ", id)
    const VariantAnnotations = await fetchVariantAnnotations(id);
    console.log(VariantAnnotations);
}
 useEffect(() => {
    if (project) {
        fetchVariantTypes();
        fetchNballeles();
        fetchPloidyLevel();
        fetchReferences();
        fetchVariantEffects();
        fetchIndividuals();
        // fetchProjects();
        fetchSearchableAnnotations();
        fetchMetadata();
    }
}, [/*project, */assembly]);

useEffect(() => {
    const fetchData = async () => {
      if (searchVar === true) {
        try {
          const answer = await fetchVariantsSearch();
          console.log("Got those variants: ", answer); // Use `answer` here
          console.log(`Got ${answer.count || 0} variants`); // Adjust for `answer.count`
        } catch (error) {
          console.error("Error fetching variants:", error);
        }
      }
    };
  
    fetchData();
  }, [searchVar]);
  

////
const columns = Array.from(
    new Set(
      metadata.flatMap((entry) =>
        entry.additionalInfo ? Object.keys(entry.additionalInfo) : []
      )
    )
  );
  
  const maxRows = Math.max(
    metadata.length,
    individuals.length
  );
  
    function handleSearchVariants(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
        
        setSearchVar(!searchVar)
    }

  const { showFullModal, fullModalContent, handleOpenFullModal, handleCloseFullModal } = useFullModal();

////

  return (
    <div className="database-page-root">
        <DatasetSelection initialTaxon={taxon} initialDatabase={database} initialProject={project} />
        <h3>Database: {database}; project: {project}{ploidyLevel && <p>; ploidy level: {ploidyLevel}</p>}</h3>
            <Button
                variant="primary"
                onClick={() => handleOpenFullModal({title:"View current data in IGV"})}
            >
                Open IGV Viewer
            </Button>
        
            <FullModal
                show={showFullModal}
                title={fullModalContent?.title || ""}
                onClose={handleCloseFullModal}
            >
                <FiltersProvider>
                    <IGVBrowser chromosomes={refs.map(r => r.referenceName)}/*token={""} selectedIndividuals={[]}*/ />
                </FiltersProvider>
            </FullModal>

            <Form className='w-20'>
                <Form.Group className="w-100" controlId="variant-types">
                    <Form.Select size="sm" aria-label="Default select example">
                        <option>Any</option>
                          {vartypes.map((reference, index) => (
                              <option key={index}>{reference}</option>
                          ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="w-100" controlId="alleles-number">
                    <Form.Select size="sm" aria-label="Default select example">
                        <option>Any</option>
                          {nballeles.map((reference, index) => (
                              <option key={index}>{reference}</option>
                          ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="w-100" controlId="sequences">
                    <Form.Select size="sm" aria-label="Default select example">
                        <option>All</option>
                          {refs.map((reference, index) => (
                              <option key={index}>{reference.referenceName}</option>
                          ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="w-100" controlId="variant-effects">
                    <Form.Select size="sm" aria-label="Default select example">
                        <option>All</option>
                          {vareffects.map((reference, index) => (
                              index!==0 && <option key={index}>{reference}</option>
                          ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="w-100" controlId="individuals">
                    <Form.Select size="sm" aria-label="Default select example">
                        <option>All</option>
                          {individuals.map((reference, index) => (
                              <option key={index}>{reference.name}</option>
                          ))}
                    </Form.Select>
                </Form.Group>
                {/* <Form.Group className="w-100" controlId="projects">
                    <Form.Select size="sm" aria-label="Default select example">
                        
                          {projects.map((reference, index) => (
                              <option key={reference.id}>{reference.name}</option>
                          ))}
                    </Form.Select>
                </Form.Group> */}
                <Form.Group className="w-100" controlId="searchable-annotations">
                    <Form.Select size="sm" aria-label="Default select example">
                        
                          {searchableannotations.map((reference, index) => (
                              <option key={index}>{reference}</option>
                          ))}
                    </Form.Select>
                </Form.Group>
                <Button variant="secondary" onClick={handleShowModal}>Show Metadata Table</Button>
                <Button variant="dark" onClick={handleSearchVariants}>Search for variants</Button>
      
            </Form>
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Metadata Table</Modal.Title>
                    
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Individuals</th>
                                {columns.map((col, index) => (
                                <th key={index}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {individuals.map((individual, rowIndex) => {
                                // Find metadata entry that matches the individual's ID
                                const metadataEntry = metadata.find((entry) => entry.id === individual.name);
                                const additionalInfo = metadataEntry?.additionalInfo || {};
                                
                                return (
                                <tr key={rowIndex}>
                                    <td>{individual.name}</td>
                                    {columns.map((col, colIndex) => (
                                    <td key={colIndex}>
                                        {additionalInfo[col] !== "" ? additionalInfo[col] : "N/A"}
                                    </td>
                                    ))}
                                </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </Modal.Body>


                <Modal.Footer>
                    <Button variant="primary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            

            {loading ? (
            <div className="database-loading-wrapper">
                <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 database-loading-overlay"
                >
                </div>
                <Table
                striped
                bordered
                hover
                className="database-loading-table"
                >
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Sequence</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Alleles</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan="5">
                            <span className="spinner-border text-secondary me-2" role="status" aria-hidden="true"></span>
                            {/* Bootstrap Icons clock (if you have bootstrap-icons installed) */}
                            <i className="bi bi-clock-history me-2 database-loading-icon"></i>
                            <span>Loading variants...</span>
                        </td>
                    </tr>
                </tbody>
                </Table>
            </div>
            )  : (
            <Table
                striped
                bordered
                hover
                className="database-results-table"
            >
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Sequence</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Alleles</th>
                </tr>
                </thead>
                <tbody>
                {variantsSearch.variants.map((individual, rowIndex) => (
                    <tr key={rowIndex} onClick={() => showVariantDetails(individual.id)}>
                    <td>{individual.id}</td>
                    <td>{individual.referenceName}</td>
                    <td>{individual.start}</td>
                    <td>{individual.end}</td>
                    <td>
                        <div>{individual.referenceBases}</div>
                        -
                        {individual.alternateBases.map((val, i) => (
                        <div key={i}>{val}</div>
                        ))}
                    </td>
                    </tr>
                ))}
                </tbody>
            </Table>
            )}
        </div>
  );
}

export default Database;
