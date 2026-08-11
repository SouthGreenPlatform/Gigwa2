import { AxiosInstance } from "axios";
import endpoints from "../endpoints";

/* ******************************************* */
/* ******* Variants Details API calls ******** */

/**  Annotations for a variant */
export async function fetchVariantAnnotations(
  api: AxiosInstance,
  variantId: string,
  projects: string,
  assemblyFullName: string | undefined,
) {
  try {
    const VartiantAnnotations = await api.get(
      `${endpoints.VARIANT_ANNOTATIONS_URL}/${variantId}/${projects}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          assembly: assemblyFullName?.split("§")[1],
        },
      },
    );
    return VartiantAnnotations.data;
  } catch (err) {
    console.error(err);
  }
}

/**  Details for a variant */
export async function fetchVariantDetails(
  api: AxiosInstance,
  variantId: string,
  projectId: string,
  run: string,
  assemblyFullName: string | undefined,
) {
  try {
    const VartiantDetails = await api.post(
      `${endpoints.VARIANT_DETAILS_GENOTYPES_URL}/${variantId}§${projectId}§${run}`,
      { callSetIds: [] },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          assembly: assemblyFullName.split("§")[1],
        },
      },
    );
    return VartiantDetails.data;
  } catch (err) {
    console.error(err);
  }
}

/** Annotaions table's header definitions */
export async function fetchHeaderDefinitionsForVariantAnnotations(
  api: AxiosInstance,
  projectFullName: string,
) {
  const response = await api.get(
    `${endpoints.ANNOTATION_HEADER_URL}/${projectFullName}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  return response.data.annotationHeaders;
}

/* ******* Searchable options for variant filtering API calls ******** */

/**  Variant types available*/
export async function fetchVariantTypes(
  api: AxiosInstance,
  projectFullName: string | undefined,
) {
  const varTypes = await api.get(
    `${endpoints.VARIANT_TYPES_URL}/${projectFullName}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );

  const types = varTypes.data;
  return types;
}

/**  Variant effects available*/
export async function fetchVariantEffects(
  api: AxiosInstance,
  projectFullName: string | undefined,
) {
  const varEffects = await api.get(
    `${endpoints.VARIANT_EFFECTS_URL}/${projectFullName}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  return varEffects.data.effectAnnotations;
}

/** Number of alleles available */
export async function fetchNballeles(
  api: AxiosInstance,
  projectFullName: string | undefined,
) {
  const nbAlleles = await api.get(
    `${endpoints.NUMBER_ALLELES_URL}/${projectFullName}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  return nbAlleles.data.numberOfAllele;
}

/** Sequences (contigs, scaffolds or chromosomes depending on assembly) available */
export async function fetchSequences(
  api: AxiosInstance,
  assemblyFullName: string | undefined,
) {
  const references = await api.post(
    `${endpoints.SEQUENCES_URL}`,
    {
      referenceSetDbIds: [assemblyFullName],
    },
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  return references.data.result.data;
}

/* ******* Searchable options for individual filtering API calls ******** */

/** Individuals/Samples available*/
export async function fetchIndividuals(
  api: AxiosInstance,
  workWithSamples: boolean,
  projectFullName: string | undefined,
) {
  const Individuals = await api.post(
    `${endpoints.INDIVIDUALS_URL}`,
    {
      variantSetId: projectFullName,
      name: null,
      pageSize: null,
      pageToken: null,
    },
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        workWithSamples: workWithSamples,
      },
    },
  );
  const ind = Individuals.data;
  const individualsOptionsName = ind.callSets.map((item) => item["name"]);
  const individualsOptionsIDs = ind.callSets.map((item) => item["id"]);
  const individualsOrSamplesNamesAndIDs = {
    IDs: individualsOptionsIDs,
    names: individualsOptionsName,
  };
  return individualsOrSamplesNamesAndIDs;
}

/** Individuals/Samples distinct metadata */
export async function fetchDistinctIndividualMetadata(
  api: AxiosInstance,
  workWithSamples: boolean,
  databaseName: string | undefined,
  projectFullName: string | undefined,
  assemblyFullName: string | undefined,
) {
  try {
    const endpointForMetadata = workWithSamples
      ? `${endpoints.DISTINCT_SAMPLE_METADATA}`
      : `${endpoints.DISTINCT_INDIVIDUAL_METADATA}`;
    const Metadata = await api.post(
      `${endpointForMetadata}/${databaseName}?projIDs=${projectFullName
        ?.split(",")
        .map((item) => item.split("§")[1])
        .join(",")}`,

      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          assembly: assemblyFullName?.split("§")[1],
        },
      },
    );
    return Metadata.data;
  } catch (err) {
    console.log(err);
  }
}

/**  Searchable annotations available */
export async function fetchSearchableAnnotations(
  api: AxiosInstance,
  projectFullName: string | undefined,
) {
  const annotationsSearchable = await api.get(
    `${endpoints.SEARCHABLE_FIELDS_URL}/${projectFullName}`,
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  return annotationsSearchable.data;
}

/**  Genotype patterns available */
export async function fetchGenotypePatterns(api: AxiosInstance) {
  const genotypePatterns = await api.get(`${endpoints.GENOTYPE_PATTERNS_URL}`, {
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
  });
  return genotypePatterns.data;
}

/* ******* General ******** */

/**  Export formats available */
export async function fetchExportFormats(api: AxiosInstance) {
  const exportFormatsResp = await api.get(`${endpoints.EXPORT_FORMATS_URL}`, {
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
  });
  return exportFormatsResp.data;
}

/** Projects in the database */
export async function fetchProjectsDb(
  api: AxiosInstance,
  databaseName: string | undefined,
) {
  const response = await api.post(
    `${endpoints.DATABASE_PROJECTS_URL}`,
    {
      datasetId: databaseName,
      pageSize: null,
      pageToken: null,
    },
    {
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    },
  );
  return response.data.variantSets;
}

/** Runs for projects */
export async function fetchRuns(
  api: AxiosInstance,
  projectFullName: string | undefined,
) {
  const runs = await api.get(`${endpoints.RUNS_URL}${projectFullName}`);
  return runs.data;
}

/** Database summary  */
export async function fetchDatabaseSummary(
  api: AxiosInstance,
  database: string | undefined,
): Promise<string | undefined> {
  const resp = await api.get(`${endpoints.REST_BASE_URL}/${database}/brapi/v1`);
  const description: string | undefined = resp.data?.description;
  return description?.replace(/germplasm/g, "individuals");
}

/* ******************************************* */
/* ******************************************* */
