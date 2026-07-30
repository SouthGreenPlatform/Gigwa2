import { Form, Col, Row, Alert, Modal, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import DatabaseSelect from './DatabaseSelect';
import endpoints from '../endpoints';
import { useApi } from "../contexts/Authentication.tsx";
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import TaxonModal from '../components/TaxonModal';
import { ExclamationTriangle } from 'react-bootstrap-icons';
import { AxiosError } from 'axios';
import '../styles/import-info-part.scss';

interface VariantSet{
  id: string;
  name: string;
  datasetId: string;
  referenceSetId: string;
  metadata: [any];
}

//Specify validation schema (function to base some rules on isAuthenticated)
export const getStep1Schema = (canCreateDB: boolean) => z.object({
  selectedHost: z.string().nonempty("Host field is missing"),
  selectedDb: z.string().optional(),
  selectedProject: z.string().optional(),
  selectedRun: z.string().optional(),
  taxonId: z.string().optional(),
  ploidy: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null;
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed)) return val;
        return parsed;
      }
      return val;
    },
    z.number().int().positive().nullable()
  ),
  newDatabaseName: z.string().optional(),
  newProjectName: z.string().optional(),
  newRunName: z.string().optional(),
  technologyName: z.string().optional(),
  skipMonomorphic: z.boolean().optional(),
  projectDescription: z.string().optional(),
  clearProject: z.boolean().optional()
}).superRefine((data, ctx) => {
  if (canCreateDB && !data.selectedDb && !data.newDatabaseName) {
    ctx.addIssue({
      path: ["selectedDb"],
      code: z.ZodIssueCode.custom,
      message: 'Select a database or define a new one',
    });
  }
  if (!data.selectedProject && !data.newProjectName) {
    ctx.addIssue({
      path: ["selectedProject"],
      code: z.ZodIssueCode.custom,
      message: 'Select a project or define a new one',
    });
  }
  if (!data.selectedRun && !data.newRunName) {
    ctx.addIssue({
      path: ["selectedRun"],
      code: z.ZodIssueCode.custom,
      message: 'Select a run or define a new one',
    });
  }
  
});

interface ImportInfoPartComponentProps {
  canCreateDB: boolean;
}
  
export type Step1FormValues = z.infer<ReturnType<typeof getStep1Schema>>;

function ImportInfoPart({ canCreateDB }: ImportInfoPartComponentProps) {

  const { register, setValue, getValues, watch, control } = useFormContext<Step1FormValues>();
  const [hosts, setHosts] = useState<string[]>([]);
  const [canCreateProject, setCanCreateProject] = useState<boolean>(false);
  const [projects, setProjects] = useState<Map<string, VariantSet>>(new Map());
  const [runs, setRuns] = useState<string[]>([]);
  const api = useApi();

  const selectedProject = useWatch({name: 'selectedProject'});
  const selectedRun = useWatch({name: 'selectedRun'});
  const selectedDb = useWatch({name: 'selectedDb'});
  const newDb = useWatch({name: 'newDatabaseName'});
  const projectDescription = useWatch({name: 'projectDescription'}) 

  const [showTaxonModal, setShowTaxonModal] = useState(false);

  useEffect(() => {	
    // Fetch hosts
    api.get(endpoints.HOSTS_URL).then(response => {
      setHosts(response.data.host);
      // if no user selection then the element which appears selected is well kept when submitting form
      if (!watch("selectedHost")) {
        setValue("selectedHost", response.data.host[0]);
      }
    });
  }, []);  

  useEffect(() => {
    if (selectedDb !== "") {
      // Fetch projects based on selected database
      api.post(
        endpoints.DATABASE_PROJECTS_URL, 
        {"datasetId":selectedDb,"pageSize":null,"pageToken":null},
        { headers: {
          'writable': true
        }}
      ).then(response => {

        const canCreateProject = response.data.variantSets.some(
          (variantSet: VariantSet) => variantSet.id === undefined
        );
        const projectsMap = new Map<string, VariantSet>(
          response.data.variantSets
            .filter((variantSet: VariantSet) => variantSet.id !== undefined) //remove undefined variantSet from the map
            .map((variantSet: VariantSet) => [variantSet.name, variantSet])
        );
        setProjects(projectsMap);
        setCanCreateProject(canCreateProject);

        const currentProject = getValues("selectedProject");
        if (currentProject && !projectsMap.has(currentProject)) {
          setValue("selectedProject", "");
        }

        //force selection of first elt
        if (!currentProject && projectsMap.size > 0) {
          const firstProjectName = projectsMap.keys().next().value;
          if (firstProjectName !== undefined) {
            setValue("selectedProject", firstProjectName);
          }
        }
      });      
    } 
  }, [selectedDb]);

  useEffect(() => {
    let projDescription = "";
    if (selectedProject !== "") {
      // Fetch projects based on selected database
      const projectId = projects.get(selectedProject)?.id;
      if (projectId != undefined) {
        let url = endpoints.RUNS_URL +  encodeURIComponent(projectId);
        api.get(url).then(response => {
          const runsArray =  Object.values(response.data).flat() as string[];
          setRuns(runsArray);
        });
        //Get project description      
        const project = projects.get(selectedProject);      
        if (project) {
          try {
            projDescription = project.metadata.find(item => item.key === "description")?.value || "";
          } catch (error) {
          }
        }
      }
    } else {
      setRuns([]);
      //force selection of "new Run" when selecting "new Project"
      setValue("selectedRun", "");

    }
    if (!projectDescription) {
      setValue("projectDescription", projDescription);
    }
  }, [selectedProject]);

  const handleTaxonInputClick = () => {
    setShowTaxonModal(true);
  };

  const handleModalSelect = (scientificName: string) => {
    setValue('taxonId', scientificName);
  };
    
  return (
    <div>
      {/* ── Storage target ───────────────────── */}
      <div className="import-section import-section-primary">
        <div className="import-section-label">Storage target</div>

        <Form.Group controlId="host" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-info-label-right">
            Host<span className="import-info-required">*</span>
          </Form.Label>
          <Col sm={4}>
            <Form.Select {...register("selectedHost")}>
              {hosts.map((host, index) => (
                <option key={index} value={host}>{host}</option>
              ))}
            </Form.Select>
          </Col>
          <Col>
            {!selectedDb && !canCreateDB && (
              <div className="import-info-warning">
                <ExclamationTriangle />
                You may only create temporary databases
              </div>
            )}
          </Col>
        </Form.Group>

        <Form.Group controlId="database" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-info-label-right">
            Database<span className="import-info-required">*</span>
          </Form.Label>
          <Col sm={5}>
            <div className="import-info-db-row">
              <Controller
                name="selectedDb"
                control={control}
                render={({ field }) => (
                  <DatabaseSelect {...field} newDb={true} writable={true} />
                )}
              />
              {!selectedDb && canCreateDB && (
                <Form.Control
                  type="text"
                  placeholder="New database name"
                  {...register('newDatabaseName')}
                  className="import-info-new-db-input"
                />
              )}
            </div>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-info-label-right">
            Ploidy
          </Form.Label>
          <Col sm={2}>
            <Form.Control type="number" placeholder="Ploidy" {...register('ploidy')} />
          </Col>
          {!selectedDb && (
            <>
              <Form.Label column sm={2} className="import-info-label-right">
                Taxon
              </Form.Label>
              <Col sm={3}>
                <Form.Control onClick={handleTaxonInputClick} type="text" placeholder="Taxon id" {...register('taxonId')} />
              </Col>
            </>
          )}
        </Form.Group>
      </div>

      {/* ── Project & Run ────────────────────── */}
      <div className="import-section">
        <div className="import-section-label">Project &amp; Run</div>

        <Form.Group controlId="project" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-info-label-right">
            Project<span className="import-info-required">*</span>
          </Form.Label>
          <Col sm={4}>
            <Controller //necessary to keep the user selection when going back to this step
              name="selectedProject"
              control={control}
              render={({ field }) => (
                <Form.Select aria-label="Project select" {...field}>
                  {(canCreateProject || selectedDb === "") && <option value="">- new project -</option>}
                  {[...projects.entries()].map(([name]) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Form.Select>
              )}
            />
          </Col>
          <Col sm={5}>
            {(newDb || selectedDb === "" || (canCreateProject && selectedProject == "")) ? (
              <Form.Control
                type="text"
                placeholder="New project name"
                {...register('newProjectName')}
              />
            ) : (
              <Form.Check
                type="checkbox"
                label="Clear project before import"
                {...register('clearProject')}
                inline
              />
            )}
          </Col>
        </Form.Group>

        <Form.Group controlId="run" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-info-label-right">
            Run<span className="import-info-required">*</span>
          </Form.Label>
          <Col sm={4}>
            <Controller
              name="selectedRun"
              control={control}
              render={({ field }) => (
                <Form.Select aria-label="Run select" {...field}>
                  <option value="">- new run -</option>
                  {runs.map((run, index) => (
                    <option key={index} value={run}>{run}</option>
                  ))}
                </Form.Select>
              )}
            />
          </Col>
          <Col sm={5}>
            {!selectedRun ? (
              <Form.Control
                type="text"
                placeholder="New run name"
                {...register('newRunName')}
              />
            ) : (
              <Alert variant="warning">
                <span className="glyphicon glyphicon-warning-sign" />
                Existing run data will be erased!
              </Alert>
            )}
          </Col>
        </Form.Group>
      </div>

      {/* ── Options ──────────────────────────── */}
      <div className="import-section">
        <div className="import-section-label">Options</div>

        <Form.Group controlId="techno" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-info-label-right">
            Technology
          </Form.Label>
          <Col sm={4}>
            <Form.Control type="text" placeholder="Name of genotyping technology" {...register('technologyName')} />
          </Col>
          <Col sm={5}>
            <Form.Check
              type="checkbox"
              label="Skip monomorphic variants"
              {...register('skipMonomorphic')}
              inline
            />
          </Col>
        </Form.Group>

        <Form.Group controlId="description" as={Row} className="mb-3">
          <Form.Label column sm={3} className="import-info-label-right">
            Project description
          </Form.Label>
          <Col sm={9}>
            <Form.Control as="textarea" rows={3} {...register('projectDescription')} />
          </Col>
        </Form.Group>
      </div>

      <TaxonModal
        show={showTaxonModal}
        onClose={() => setShowTaxonModal(false)}
        onSelect={handleModalSelect}
      />
    </div>
  )
}

export default ImportInfoPart;