import endpoints from "../endpoints";
import { colNameMap } from "./ImportMetadataPart";
import { Step1FormValues } from "./ImportInfoPart";
import { Step2FormValues } from "./ImportDatasourcePart";
import { Step3FormValues } from "./ImportMetadataPart";
import { hashCode } from "../tools/commons";

export type ImportFormValues =
  Step1FormValues & Step2FormValues & Step3FormValues;

export interface ImportGenotypesResult {
  progressToken: string;
  moduleName: string;
}

export async function importGenotypes(
  api: any,
  data: ImportFormValues,
  canCreateDB: boolean,
  token: string | null
): Promise<ImportGenotypesResult> {
  const formData = new FormData();
  let nextIndex = 0;

  if (data.selectedHost) formData.append("host", data.selectedHost);

  let moduleName = "";
  if (!canCreateDB && token && data.selectedDb === "") { //create temp database
    const tokenHash = hashCode(token).toString(16);
    const timeHash = hashCode(Date.now()).toString(16);
    moduleName = `${tokenHash}O${timeHash}`;
    formData.append("module", moduleName);
  } else if (data.newDatabaseName) {
    moduleName = data.newDatabaseName;
    formData.append("module", moduleName);
  } else if (data.selectedDb) {
    moduleName = data.selectedDb;
    formData.append("moduleExistingG", moduleName);
    formData.append("module", moduleName);
  }

  if (data.newProjectName) {
    formData.append("project", data.newProjectName);
  } else if (data.selectedProject) {
    formData.append("projectExisting", data.selectedProject);
    formData.append("project", data.selectedProject);
    // formData.append("projectExisting", data.selectedProject.split("§")[1]);
    // formData.append("project", data.selectedProject.split("§")[1]);
  }

  if (data.newRunName) {
    formData.append("run", data.newRunName);
  } else if (data.selectedRun) {
    formData.append("run", data.selectedRun); // get 500, if run is not given
    formData.append("runExisting", data.selectedRun);
  }

  if (data.ploidy) formData.append("ploidy", String(data.ploidy));
  if (data.clearProject) formData.append("clearProjectData", "on");
  if (data.projectDescription) formData.append("projectDesc", data.projectDescription);
  if (data.technologyName) formData.append("technology", data.technologyName);
  if (data.skipMonomorphic) formData.append("skipMonomorphic", "on");
  if (data.taxonId) formData.append("ncbiTaxon", data.taxonId);
  if (data.selectedIndSample === "2") formData.append("providingSamples", "on");

  data.files?.forEach((file, i) => {
    formData.append(`file[${i}]`, file);
    nextIndex++;
  });

  data.mappingFile?.forEach((mappingFile, i) => {
    formData.append(`file[${data.files.length + i}]`, mappingFile);
    nextIndex++;
  });

  if (data.brapiEndpoint) formData.append("dataFile1", data.brapiEndpoint);

  if (data.metadataSelectedIndSample) {
    formData.append(
      "metadataType",
      colNameMap[data.metadataSelectedIndSample]
    );
  }

  if (data.metadataFiles) {
    data.metadataFiles.forEach((file, i) => {
      const renamed = new File([file], `${file.name}.phenotype`, {
        type: file.type
      });
      formData.append(`file[${i + nextIndex}]`, renamed);
    });
  }

  if (data.metadataSelectedImportingWay === "2" && data.metadataBrapiUrls) {
    formData.append("brapiURLs", data.metadataBrapiUrls.join(" ; "));
  } else { //to avoid api error
    formData.append("brapiURLs", "");
  }

  if (data.metadataBrapiTokens) {
    formData.append("brapiTokens", data.metadataBrapiTokens.join(" ; "));
  } else { //to avoid api error
    formData.append("brapiTokens", "");
  }

  const response = await api.post(
    endpoints.IMPORT_GENOTYPES_URL,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  if (response.status !== 200) {
    throw new Error(response.status);
  }

  return { progressToken: response.data, moduleName };
}

export async function importMetadata(
  api: any,
  formValues: Step3FormValues
): Promise<string> {

  // Build request body
  const formData = new FormData();

  if (formValues.metadataSelectedDb) {
    formData.append("moduleExistingMD", formValues.metadataSelectedDb);
  }

  if (formValues.metadataSelectedIndSample) {
    formData.append("metadataType", colNameMap[formValues.metadataSelectedIndSample])
  }

  if (formValues.metadataFileUrl) {
    formData.append("metadataFile1", formValues.metadataFileUrl);
  }

  // importing from BrAPI with ext sources in metadata file
  if (formValues.metadataSelectedSourceType === "2" && formValues.metadataSelectedImportingWay === "1") {
    formData.append("useBrapiMdEndpoint", "on");
  }

  if (formValues.metadataBrapiEndpoint) {
    formData.append("metadataFile1", formValues.metadataBrapiEndpoint);
  }

  if (formValues.metadataSelectedImportingWay === "2" && formValues.metadataBrapiUrls) {
    formData.append("brapiURLs", formValues.metadataBrapiUrls.join(" ; "));
  } else { //to avoid api error
    formData.append("brapiURLs", "");
  }

  if (formValues.metadataBrapiTokens) {
    formData.append("brapiTokens", formValues.metadataBrapiTokens.join(" ; "));
  } else { //to avoid api error
    formData.append("brapiTokens", "");
  }

  if (formValues.metadataFiles) {
    formValues.metadataFiles.forEach((file, index) => {
      formData.append(`file[${index}]`, file); 
    });
  }

  const response = await api.post(
    endpoints.IMPORT_METADATA_URL, 
    formData, 
    {
      headers: {'Content-Type': 'multipart/form-data'}      
    }
  );

  if (response.status !== 200) {
    throw new Error("Metadata import failed");
  }

  return response.data;
}

export async function getMaxUploadSize(
  api: any
): Promise<string> {
  const response = await api.get(`${endpoints.MAX_UPLOAD_SIZE_URL}?capped=true`);
  const size = response.data > 0 ? response.data: null
  return size;
} 
