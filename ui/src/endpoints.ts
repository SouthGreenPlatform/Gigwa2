import config from "./config/config";

if (config.INSTANCE_URL.endsWith('/')) {
  console.warn("Removing the trailing slash from the config parameter INSTANCE_URL");
  config.INSTANCE_URL = config.INSTANCE_URL.slice(0, -1);
}

const REST_BASE_URL = config.INSTANCE_URL + "/rest"
const GIGWA_REST_ENDPOINT = REST_BASE_URL + "/gigwa";
const BRAPI_REST_ENDPOINT = REST_BASE_URL + "/brapi/v2";
const GA4GH_REST_ENDPOINT = REST_BASE_URL + "/ga4gh";

const endpoints = {
  REST_BASE_URL:		                REST_BASE_URL,
  SWAGGER_URL:		                  REST_BASE_URL + '/swagger-ui/index.html',
  IGV_PROXY_URL:                    REST_BASE_URL + "/igvProxy",

  DOCS_URL:		                      config.INSTANCE_URL + '/docs/gigwa_docs.html',
  LOST_PASSWORD_URL:                config.INSTANCE_URL + "/lostPassword.do",
  RESET_PASSWORD_URL:               config.INSTANCE_URL + "/resetPassword.do",
  LOGOUT_URL:                       config.INSTANCE_URL + "/logout",
  CAS_SERVICE_URL:                  config.INSTANCE_URL + '/login/cas',

  VARIANT_EFFECTS_URL:	          	GIGWA_REST_ENDPOINT + "/effectAnnotations", // Effects annotations for a project's database
  HOSTS_URL:	                    	GIGWA_REST_ENDPOINT + "/hosts", // hosts
  RUNS_URL:		                      GIGWA_REST_ENDPOINT + "/runs/", // Runs
  METADATA_VALIDATION_URL:	      	GIGWA_REST_ENDPOINT + "/metadataValidation", // Check in metadata import page
  IGV_DATA:		                      GIGWA_REST_ENDPOINT + "/igvData", // IGV data dynamically passed as TSV
  LOGIN_URL:		                    GIGWA_REST_ENDPOINT + '/generateToken',
  INSTANCE_CONTENTS_URL:	        	GIGWA_REST_ENDPOINT + '/instanceContentSummary', // Summary for an instance
  VARIANT_TYPES_URL:	            	GIGWA_REST_ENDPOINT + '/variantTypes', // Types of variants for a project's database
  PLOIDY_LEVEL_URL:		              GIGWA_REST_ENDPOINT + '/ploidyLevel', // Ploidy level for a project's database
  NUMBER_ALLELES_URL:		            GIGWA_REST_ENDPOINT + '/numberOfAllele', // Number of alleles for a project's database
  SEARCHABLE_FIELDS_URL:	        	GIGWA_REST_ENDPOINT + '/searchableAnnotationFields', // Searchable fields for a project's database (e.g. DP, GQ...etc)
  DATABASE_METADATA_URL:		        GIGWA_REST_ENDPOINT + '/filterIndividualsFromMetadata', // Metadata for a projects' individuals
  DATABASE_SAMPLE_METADATA_URL:     GIGWA_REST_ENDPOINT + '/filterSamplesFromMetadata', // Metadata for a projects' samples
  IMPORT_METADATA_URL:              GIGWA_REST_ENDPOINT + "/metadataImport", // Import metadata
  IMPORT_GENOTYPES_URL:             GIGWA_REST_ENDPOINT + "/genotypeImport", // Import genotypes
  GENOTYPE_PATTERNS_URL:            GIGWA_REST_ENDPOINT + "/genotypePatterns",
  GENE_LOOKUP_URL:                  GIGWA_REST_ENDPOINT + "/genes/lookup",
  VARIANT_LOOKUP_URL:               GIGWA_REST_ENDPOINT + "/variants/lookup",
  EXPORT_FORMATS_URL:               GIGWA_REST_ENDPOINT + "/exportFormats",
  EXPORT_URL:                       GIGWA_REST_ENDPOINT + "/exportData",
  PROGRESS_URL:                     GIGWA_REST_ENDPOINT + "/progress",
  ABORT_PROCESS_URL:                GIGWA_REST_ENDPOINT + "/abortProcess",
  DISTINCT_INDIVIDUAL_METADATA:     GIGWA_REST_ENDPOINT + "/distinctIndividualMetadata", // distinct values for individuals' metadata for given projects.
  DISTINCT_SAMPLE_METADATA:         GIGWA_REST_ENDPOINT + "/distinctSampleMetadata", // distinct values for samples' metadata for given projects.
  SAVE_QUERY_URL:                   GIGWA_REST_ENDPOINT + "/saveQuery",
  LOAD_QUERIES_URL:                 GIGWA_REST_ENDPOINT + "/listSavedQueries",
  LOAD_QUERY_URL:                   GIGWA_REST_ENDPOINT + "/loadQuery",
  DELETE_QUERY_URL:                 GIGWA_REST_ENDPOINT + "/deleteQuery",
  ONLINE_OUTPUT_TOOLS:              GIGWA_REST_ENDPOINT + "/onlineOutputTools",
  DROP_TEMP_COLLECTIONS_URL:        GIGWA_REST_ENDPOINT + "/dropTempCol",
  MAX_UPLOAD_SIZE_URL:              GIGWA_REST_ENDPOINT + "/maxUploadSize",
  USER_INFO_URL:                    GIGWA_REST_ENDPOINT + "/userInfo",
  SEARCHABLE_ANNOTATION_FIELDS_URL: GIGWA_REST_ENDPOINT + "/searchableAnnotationFields",
  DISTINCT_SELECTED_SEQUENCES_URL:  GIGWA_REST_ENDPOINT + "/distinctSelectedSequences",
  FST_DATA_URL:                     GIGWA_REST_ENDPOINT + "/fstData",
  MAF_DATA_URL:                     GIGWA_REST_ENDPOINT + "/mafData",
  TAJIMA_D_DATA_URL:                GIGWA_REST_ENDPOINT + "/tajimaDData",
  DENSITY_DATA_URL:                 GIGWA_REST_ENDPOINT + "/densityData",
  MISSING_DATA_PATH:                GIGWA_REST_ENDPOINT + "/missingData",
  HETZ_DATA_PATH:                   GIGWA_REST_ENDPOINT + "/heterozygosityData",
  VCF_FIELD_PLOT_DATA_PATH:         GIGWA_REST_ENDPOINT + "/vcfFieldPlotData",
  ANNOTATION_HEADER_URL:            GIGWA_REST_ENDPOINT + "/annotationHeaders", // Gets variant metadata headers' definitions for a project's database. 
  IGV_GENOME_CONFIG_PATH:           GIGWA_REST_ENDPOINT + "/igvGenomeConfig",
  CONFIG_PARAM_URL:                 GIGWA_REST_ENDPOINT + "/configParams",
  MANDATORY_METADATA_URL:           GIGWA_REST_ENDPOINT + "/mandatoryMetadata",
  GALAXY_HISTORY_PUSH_URL:          GIGWA_REST_ENDPOINT + "/pushToGalaxyHistory",
  TERMS_OF_USE_COOKIE_DURATION_URL: GIGWA_REST_ENDPOINT + "/termsOfUseCookieDurationInHours",

  GA4GH_SEARCH_REFERENCESETS_URL:		GA4GH_REST_ENDPOINT + '/referencesets/search', // Databases available for given user
  INDIVIDUALS_URL:	              	GA4GH_REST_ENDPOINT + '/callsets/search', // Individuals or samples for a project's database
  DATABASE_PROJECTS_URL:	        	GA4GH_REST_ENDPOINT + '/variantsets/search', // Projects of a database
  VARIANTS_SEARCH_URL:	          	GA4GH_REST_ENDPOINT + '/variants/search', // Search variants with filters
  VARIANT_DETAILS_GENOTYPES_URL:		GA4GH_REST_ENDPOINT + '/variants', // Retrieve variant details and individuals' genotypes
  VARIANT_ANNOTATIONS_URL:	      	GA4GH_REST_ENDPOINT + '/variantAnnotations', // Retrieve variant annotations.

  SEQUENCES_URL:		                BRAPI_REST_ENDPOINT + '/search/references', // Sequences (chromosome, contigs or scaffolds) for a project's database
  BRAPI_SEARCH_REFERENCESETS_URL:   BRAPI_REST_ENDPOINT + '/search/referencesets', // List assemblies for a given database
};

export default endpoints;
