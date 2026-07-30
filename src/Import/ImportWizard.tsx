import { Form, Container, Tooltip, Alert } from 'react-bootstrap';
import '../styles/import-wizard.scss';
import ImportInfoPart, { getStep1Schema, Step1FormValues } from "./ImportInfoPart";
import ImportDatasourcePart, { Step2FormValues, Step2Schema } from "./ImportDatasourcePart";
import MetadataImportPart, { colNameMap, Step3FormValues } from "./ImportMetadataPart.tsx";
import { useState, useEffect } from 'react';
import { useApi, useAuth } from "../contexts/Authentication.tsx";
import { Stepper } from "./Stepper.tsx";
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { z } from "zod";
import ProgressDialog from '../components/ProgressDialog.tsx';
import { Link } from 'react-router-dom';
import { getMaxUploadSize, importGenotypes } from './ImportDataService.tsx';
import endpoints from '../endpoints.ts';
import { AxiosError } from 'axios';

function ImportWizard() {	

  const api = useApi();
  const { token } = useAuth();
  const [canCreateDB, setCanCreateDB] = useState<boolean>(false); 

  const [step, setStep] = useState(0);
  const [progressToken, setProgressToken] = useState<string>("");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const steps = ["Run information", "Genotyping data", "Metadata (optional)"];  

  const [maxUploadSize, setMaxUploadSize] = useState<string | null>(null);
  // Load maxUploadSize on component mounting
  useEffect(() => {
      async function fetchMaxUploadSize() {
          try {
              const size = await getMaxUploadSize(api);
              setMaxUploadSize(size);
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

  const handleComplete = async (
    data: Step1FormValues & Step2FormValues & Step3FormValues
  ) => {
    try {
      const { progressToken, moduleName } = await importGenotypes(api, data, canCreateDB, token);
      setProgressToken(progressToken);
      setShowProgressDialog(true);
      setDataUrl("/investigate/Any taxon/" + moduleName);

    } catch (error) {
      console.error("Error during import:", error);
      setErrorMessages(["Import failed"]);
    }
  };

  const prevStep = () => setStep(step - 1);

  const nextStep = () => {
    handleStepClick(step+1);
  };

  const handleStepClick = (index: number) => {
    if (index === step) return; // stay on same step

    if (index > step) {
      // go to next step, validate current step
      let validation;
      const values = form.getValues();

      if (step === 0) {
        validation = getStep1Schema(canCreateDB).safeParse(values);
        console.log(validation)
      } else if (step === 1) {
        validation = z.object({ step2: Step2Schema }).safeParse({ step2: values });
      } else {
        validation = { success: true }; // no validation for last step
      }

      if (validation && validation.error) {
        // errors => we stay on this step
        const zodErrors = validation.error.flatten().fieldErrors;
        const msgs = Object.values(zodErrors).flat().filter(Boolean) as string[];
        console.log(zodErrors);
        console.log(msgs);
        setErrorMessages(msgs);
        return;
      }
    }
  
    // if we go previous step or validation OK, we change step
    setTimeout(() => {
      setStep(index); //add a timeout to avoid triggering submit event
      setErrorMessages([]);
    }, 100);
  };


  return (

    <div className="import-wizard-page">
      <Container className="p-4 border rounded import-form-container">
        <Stepper
          steps={steps}
          currentStep={step}
          onStepClick={handleStepClick}
        />
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(handleComplete, (errors: any) => {
            console.log("Form has errors:", errors);
          })}>
            {step === 0 && <ImportInfoPart canCreateDB={canCreateDB}/>}
            {step === 1 && <ImportDatasourcePart maxUploadSize={maxUploadSize}/>}
            {step === 2 && (
              <MetadataImportPart
                dbSelect={false}
                selectedDb={watch("selectedDb") || watch("newDatabaseName")}
              />
            )}
            <div className="mt-4 d-flex justify-content-end gap-2">
              {step > 0 && (
                  <button className="btn btn-secondary" type="button" onClick={prevStep}>
                    Back
                  </button>
              )}
              {step < 2 ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={nextStep}
                >
                  Next
                </button>
              ) : (
                <button className="btn btn-success" type="submit">
                  Submit
                </button>
              )}
            </div>
          </form>
        </FormProvider>
        {errorMessages.length > 0 && 
        <>        
          <br></br>
          <Alert variant="danger">
            {errorMessages.map((msg, index) => (
              <div key={index}>{msg}</div>
            ))}
          </Alert>
        </>

      }
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

export default ImportWizard;