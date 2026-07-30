import { Alert, Container } from "react-bootstrap";
import '../styles/import-wizard.scss';
import { FormProvider, useForm } from "react-hook-form";
import MetadataImportPart, { Step3FormValues, Step3Schema } from "./ImportMetadataPart";
import { useApi } from "../contexts/Authentication";
import { useEffect, useRef, useState } from "react";
import ProgressDialog from "../components/ProgressDialog";
import { Link, useSearchParams } from "react-router-dom";
import { importMetadata } from "./ImportDataService";

function ImportMetadata() {

  const api = useApi();
  const [progressToken, setProgressToken] = useState<string>("");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const dbFromUrl = searchParams.get("db") ?? "";

  //Alert card
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const alertRef = useRef<HTMLDivElement>(null);    

  const form = useForm<Step3FormValues>({
    defaultValues: {
      metadataSelectedDb: dbFromUrl,
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

  // Sync form  and URL
  useEffect(() => {
    const subscription = watch((values) => {
      const db = values.metadataSelectedDb;
      if (db) {
        setSearchParams({ db }, { replace: true }); // replace: true évite de polluer l'historique
      } else {
        setSearchParams({}, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setSearchParams]);


  const handleFinalSubmit = (data: Step3FormValues) => {
    let validationErrors: string[] = [];

    const step3Res = Step3Schema.safeParse(data);
    if (!step3Res.success) {
        validationErrors.push(...Object.values(step3Res.error.flatten().fieldErrors).flat().filter(Boolean));
    }

    if (validationErrors.length > 0) {
        setErrorMessages(validationErrors);
        return;
    }

    setErrorMessages([]);
    handleComplete(data);
  };

  const handleComplete = async (data: Step3FormValues) => {
    console.log('form data:', data);
    try {
      const progressToken = await importMetadata(api, data);
      setProgressToken(progressToken);
      setShowProgressDialog(true);
      setDataUrl("/investigate/Any taxon/" + data.metadataSelectedDb);
      
    } catch (error) {
      console.error("Error during import:", error);
      alert("Import failed");
    }
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
              <h3 className="import-form-title">Import Metadata</h3>
              <MetadataImportPart
                dbSelect={true}
                selectedDb={dbFromUrl}
              />
              <div className="mt-4 d-flex justify-content-end">
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
        title={"Importing data on " + watch("metadataSelectedDb")}
        showAbort={true}
        onAbort={() => {}}
        nbMin={2}
        autoClose={false}
        renderOnComplete={(msg) => (
          <Alert variant="success" className="mt-3">
            <p><strong>Metadata import complete</strong></p>
            <p>{msg}</p>
            <p>Data are available <Link to={dataUrl}>here</Link></p>
          </Alert>
        )}
        renderOnError={(msg) => (
          <Alert variant="danger" className="mt-3">
            <p><strong>Metadata import failed</strong></p>
            <p>{msg}</p>
          </Alert>
        )}
      />
    </div>
  )
}

export default ImportMetadata;