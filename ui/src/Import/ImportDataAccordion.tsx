import { Accordion, Alert, Container } from "react-bootstrap";
import '../styles/import-wizard.scss';
import ImportInfoPart, { getStep1Schema, Step1FormValues} from "./ImportInfoPart";
import { FormProvider, useForm } from "react-hook-form";
import ImportDatasourcePart, { Step2FormValues, Step2Schema } from "./ImportDatasourcePart";
import MetadataImportPart, { Step3FormValues, Step3Schema } from "./ImportMetadataPart";
import { useApi, useAuth } from "../contexts/Authentication";
import { useEffect, useRef, useState } from "react";
import ProgressDialog from "../components/ProgressDialog";
import { Link } from "react-router-dom";
import { getMaxUploadSize, importGenotypes } from "./ImportDataService";
import endpoints from "../endpoints";
import { AxiosError } from "axios";

function ImportDataAccordion() {

    const api = useApi();    
    const { token } = useAuth();
    const [canCreateDB, setCanCreateDB] = useState<boolean>(false);     
    const [maxUploadSize, setMaxUploadSize] = useState<string | null>(null);

    // Load maxUploadSize on component mounting
    useEffect(() => {
        async function fetchMaxUploadSize() {
            try {
                const size = await getMaxUploadSize(api);
                setMaxUploadSize(size);
                console.log(size)
            } catch (error) {
                console.error("Failed to get max upload size", error);
            }
        }
        fetchMaxUploadSize();

        // Fetch userInfo
        api.get(endpoints.USER_INFO_URL).then(response => {
          if (response.data.canCreateDB) {
            setCanCreateDB(true);
          }
        }).catch((error: AxiosError) => {
          if (error.response) {
            console.error("Error fetching userInfo", error);
          }
        });
    }, []); 

    const [progressToken, setProgressToken] = useState<string>("");
    const [dataUrl, setDataUrl] = useState<string>("");
    const [metadataImportUrl, setMetadataImportUrl] = useState<string>("");
    const [showProgressDialog, setShowProgressDialog] = useState(false);

    //Alert card
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const alertRef = useRef<HTMLDivElement>(null);    

    // Accordions
    const [activeKeys, setActiveKeys] = useState<string[]>(["0"]);

    const form = useForm<Step1FormValues & Step2FormValues & Step3FormValues>({
        defaultValues: {
            selectedHost: '',
            selectedDb: '',
            selectedProject: '',
            selectedRun: '',
            taxonId: '',
            ploidy: null,
            newDatabaseName: '',
            newProjectName: '',
            newRunName: '',
            technologyName: '',
            skipMonomorphic: false,
            projectDescription: '',
            clearProject: false,
            selectedIndSample: '1',
            selectedMapping: '1',
            selectedDataSourceType: '1',
            selectedFileFormat: '1',
            fileUrl: '',
            fileUrl2: '',
            brapiEndpoint: '',
            files: [],
            metadataSelectedDb: '',
            metadataSelectedIndSample: '1',
            metadataSelectedSourceType: '1',
            metadataSelectedImportingWay: '',
            metadataBrapiEndpoint: '',
            metadataFiles: [],
            metadataFileUrl: '',
            metadataBrapiUrls: [],
            metadataBrapiTokens: []
        },
        shouldUnregister: false 
    });

    const { handleSubmit, watch } = form;

   const handleFinalSubmit = (data: Step1FormValues & Step2FormValues & Step3FormValues) => {
      let validationErrors: string[] = [];

      const step1Res = getStep1Schema(canCreateDB).safeParse(data);
      const step2Res = Step2Schema.safeParse(data);

      if (!step1Res.success) {
        validationErrors.push(...Object.values(step1Res.error.flatten().fieldErrors).flat().filter(Boolean));
      }
      if (!step2Res.success) {
        validationErrors.push(...Object.values(step2Res.error.flatten().fieldErrors).flat().filter(Boolean));
      }

      // Valid step 3 only if accordion is open
      if (activeKeys.includes("2")) {
        const step3Res = Step3Schema.safeParse(data);
        if (!step3Res.success) {
            validationErrors.push(...Object.values(step3Res.error.flatten().fieldErrors).flat().filter(Boolean));
        }
      }

      if (validationErrors.length > 0) {
          setErrorMessages(validationErrors);
          return;
      }

      setErrorMessages([]);
      handleComplete(data);
    };

    const handleComplete = async (
      data: Step1FormValues & Step2FormValues & Step3FormValues
    ) => {
      try {
        const { progressToken, moduleName } = await importGenotypes(api, data, canCreateDB, token);
        setProgressToken(progressToken);
        setShowProgressDialog(true);
        setDataUrl("/investigate/Any taxon/" + moduleName);
        setMetadataImportUrl("/importMetadata/?" + moduleName);

      } catch (error) {
        console.error("Error during import:", error);
        setErrorMessages(["Import failed"]);
      }
    };

    const handleAccordionSelect = (nextKey: string | string[] | null) => {
      if (!nextKey) return;
      
      const nextKeys = Array.isArray(nextKey) ? nextKey : [nextKey];
      const newlyOpened = nextKeys.find(k => !activeKeys.includes(k));
      if (!newlyOpened) {
        setActiveKeys(nextKeys);
        return;
      }

      // let errors: string[] = [];
      // const values = form.getValues();

      // // Open "Genotyping data"
      // if (newlyOpened === "1") {
      //   const res1 = getStep1Schema(isAuthenticated).safeParse(values); 
      //   if (!res1.success) {
      //     errors.push(
      //       ...Object.values(res1.error.flatten().fieldErrors).flat()
      //     );
      //   }
      // }

      // // Open "Metadata"
      // if (newlyOpened === "2") {
      //   const res1 = getStep1Schema(isAuthenticated).safeParse(values);    1
      //   if (!res1.success) {
      //     errors.push(
      //       ...Object.values(res1.error.flatten().fieldErrors).flat()
      //     );
      //   }
      //   // const res2 = z.object({ step2: Step2Schema }).safeParse({ step2: values }); 
      //   // if (!res2.success) {
      //   //   errors.push(
      //   //     ...Object.values(res2.error.flatten().fieldErrors).flat()
      //   //   );
      //   // }
      // }

      // if (errors.length > 0) {
      //   setErrorMessages(errors.filter(Boolean) as string[]);
      //   return; 
      // } else {
      //   //all ok
      //   setErrorMessages([]);
        setActiveKeys(nextKeys);
      // }
    };

    // to automatically scroll to the Alert card
    useEffect(() => {
      if (errorMessages.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, [errorMessages]);

    return (
        <div className="import-wizard-page">
            <Container className="p-4 border rounded import-form-container">
                <FormProvider {...form}>
                    <form onSubmit={handleSubmit(handleFinalSubmit, (errors) => {
                      console.log("Form has errors:", errors);
                    })}>
                      <h3 className="import-form-title">Import Data</h3>
                      <Accordion defaultActiveKey='0' alwaysOpen activeKey={activeKeys} onSelect={handleAccordionSelect}>
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>
                            <span className="import-step-badge">1</span>
                            Run information
                          </Accordion.Header>
                          <Accordion.Body>
                            <ImportInfoPart canCreateDB={canCreateDB}/>
                          </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                          <Accordion.Header>
                            <span className="import-step-badge">2</span>
                            Genotyping data
                          </Accordion.Header>
                          <Accordion.Body>
                            <ImportDatasourcePart maxUploadSize={maxUploadSize}/>
                          </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="2">
                          <Accordion.Header>
                            <span className="import-step-badge">3</span>
                            Metadata
                            <span className="ms-2 fw-normal" style={{ fontSize: '0.75rem', color: 'inherit', opacity: 0.6 }}>(optional)</span>
                          </Accordion.Header>
                          <Accordion.Body>
                            <MetadataImportPart
                              dbSelect={false}
                              selectedDb={watch("selectedDb") || watch("newDatabaseName")}
                            />
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                      <div className="d-flex justify-content-end">
                        <button className="btn btn-success" type="submit">
                          Submit
                        </button>
                      </div>
                    </form>
                </FormProvider>
                {errorMessages.length > 0 && (
                  <Alert variant="danger" className="mt-3" ref={alertRef}>
                    {errorMessages.map((msg, index) => (
                      <div key={index}>{msg}</div>
                    ))}
                  </Alert>
                )}
            </Container>
            <ProgressDialog
              progressToken={progressToken}
              size="lg"
              show={showProgressDialog}
              onHide={() => setShowProgressDialog(false)}
              title={"Importing data on " + watch("selectedDb")}
              showAbort={true}
              onAbort={() => {}}
              nbMin={2}
              autoClose={false}
              renderOnComplete={(msg) => (
                <Alert variant="success" className="mt-3">
                  <p><strong>Import complete</strong></p>
                  <p>{msg}</p>
                  <p>Data are available <Link to={dataUrl}>here</Link></p>
                  <p>Add or amend individual / sample metadata via this <Link to={metadataImportUrl}>link</Link> </p>
                </Alert>
              )}
              renderOnError={(msg) => (
                <Alert variant="danger" className="mt-3">
                  <p><strong>Import failed</strong></p>
                  <p>{msg}</p>
                </Alert>
              )}
            />
        </div>
    )
}

export default ImportDataAccordion;