import { Form, Button, Row , Col} from 'react-bootstrap';
import { useState, useEffect, useCallback } from 'react';
import { useApi } from "../contexts/Authentication.tsx";
import endpoints from "../endpoints.ts";
import DatabaseSelect from './DatabaseSelect.tsx';
import { z } from 'zod';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { CustomDropZone } from './CustomDropZone.tsx';
import '../styles/import-metadata-part.scss';

export const Step3Schema = z.object({
  metadataSelectedDb: z.string().optional(),
  metadataSelectedIndSample: z.string().optional(),
  metadataSelectedSourceType: z.string().optional(),
  metadataSelectedImportingWay: z.string().optional(),
  metadataBrapiEndpoint: z.string().optional(),
  metadataBrapiToken: z.string().optional(),
  metadataFiles: z.array(z.any()).optional(),
  metadataFileUrl: z.string().optional(),
  metadataBrapiUrls: z.array(z.any()).optional(),
  metadataBrapiTokens: z.array(z.any()).optional()
}).superRefine((data, ctx) => {
  if (data.metadataSelectedSourceType === '1') {
    const hasFile = (data.metadataFileUrl && data.metadataFileUrl.trim() !== '') || (data.metadataFiles && data.metadataFiles.length > 0);
    if (!hasFile) {
      ctx.addIssue({
        path: ["fileUrl"],
        code: z.ZodIssueCode.custom,
        message: 'Metadata: Either file URL or a file upload is required.',
      });
    }
  } else if (data.metadataSelectedSourceType === '2') {
    if (data.metadataSelectedImportingWay === '1' && (!data.metadataBrapiEndpoint || data.metadataBrapiEndpoint === "")) {
      ctx.addIssue({
      code: "custom",
      message: "metadata brapi endpoint is required",
      path: ["selectedMapping"],
      })
    }  
    if (data.metadataSelectedImportingWay === '2') {
      const hasFile = (data.metadataFileUrl && data.metadataFileUrl.trim() !== '') || (data.metadataFiles && data.metadataFiles.length > 0);
      if (!hasFile) {
        ctx.addIssue({
          path: ["fileUrl"],
          code: z.ZodIssueCode.custom,
          message: 'Metadata: Either file URL or a file upload is required.',
        });
      }
    }
  };
});

export interface Step3FormValues extends z.infer<typeof Step3Schema> {}

export const colNameMap: { [key: string]: string } = {
  '1': 'individual',
  '2': 'sample',
};

interface Step3ComponentProps {
  dbSelect: boolean; //if true displays DatabaseSelect (when importing only metadata)
  selectedDb?: string; //if selected in first step of wizard
}

function ImportMetadataPart({ dbSelect, selectedDb }: Step3ComponentProps) {

  const { register, setValue, watch, control, getValues } = useFormContext<Step3FormValues>();
  const [dropError, setDropError] = useState<string | null>(null);

  const api = useApi();

  const metadataSelectedDb = useWatch({name: 'metadataSelectedDb'});
  const selectedIndSample = useWatch({name: 'metadataSelectedIndSample'});
  const selectedMetaDataSourceType = useWatch({name: 'metadataSelectedSourceType'});
  const selectedImportingWay = useWatch({name: 'metadataSelectedImportingWay'});
  const brapiTokens = useWatch({name: 'metadataBrapiTokens'});
  const brapiUrls = useWatch({name: 'metadataBrapiUrls'});
  const files = useWatch({name: 'metadataFiles'});
  const brapiEndpoint = useWatch({name: 'metadataBrapiEndpoint'});

  // retrieve selectedDb from first step of wizard
  // useEffect(() => {
  //   console.log(formValues);
  //   setFormValues(prev => ({ ...prev, selectedDb: selectedDb }));
  //   console.log(formValues);
    
  // }, [selectedDb]);

  useEffect(() => {
    if (selectedDb) {
      setValue("metadataSelectedDb", selectedDb);
    }
  }, [selectedDb, setValue]);

  // useCallback recreates the function only if dependencies change, avoid infinite loop
  const customValidator = useCallback(async (acceptedFiles: File[]) => {
    
    // check validity of metadata file
    const formData = new FormData();
    if (metadataSelectedDb) {
      formData.append("moduleExistingMD", metadataSelectedDb);
    } else {
      return "You have to select a database"
    }

    if (selectedIndSample) {
      formData.append("metadataType", colNameMap[selectedIndSample]);
    }

    // importing from BrAPI with ext sources in metadata file
    if (selectedMetaDataSourceType === "2" && selectedImportingWay === "1") {
      formData.append("useBrapiMdEndpoint", "on");
    }

    if (acceptedFiles) {
      acceptedFiles.forEach((file, index) => {        
        formData.append(`file[${index}]`, file); 
      });     
    }    

    try {
      const response = await api.post(endpoints.METADATA_VALIDATION_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        let brapiurls: string[] = [];
        if (response.data.length > 0) {
          brapiurls = response.data;
        }
        setValue("metadataBrapiUrls", brapiurls);
      }
      return null;

    } catch (error: any) {
      if (error.response) {
        console.log(error.response.status);
        return error.response.data as string;
      } else {
        console.log('Error', error.message);
        return error.message;
      }
    }
  }, [metadataSelectedDb, selectedIndSample, selectedMetaDataSourceType, selectedImportingWay, setValue]);

  const brapiMap: { [key: string]: string } = {
    '1': 'germplasm',
    '2': 'sample',
  };

  const getDropzoneMessage = () => {
    if (selectedMetaDataSourceType == "1") {
      return(
        <>
          <div className="mb-0">The expected format is tab separated values (<strong>.tsv</strong> or <strong>.csv</strong> extension), or <strong>Flapjack</strong>'s .phenotype file.</div>
          <div className="mb-0">The first row in TSV file (header) must contain field labels, one of them must be named <strong>{colNameMap[selectedIndSample]}</strong></div>
          <div className="mb-0">Other rows must contain field values, with an exact match for {colNameMap[selectedIndSample]} names in the above column.</div>
        </>
      )
      
    } else {
      return(
        <div>
          <p>The expected format is tab separated values (<strong>.tsv</strong> or <strong>.csv</strong> extension).</p>
          <p>The first row must contain the columns: <strong>{colNameMap[selectedIndSample]}</strong>, 
            <strong>extRefId</strong> and <strong>extRefSrc</strong> containing respectively the gigwa 
            <strong> {colNameMap[selectedIndSample]} id</strong>, 
            the remote <strong>{brapiMap[selectedIndSample]}DbId</strong> and a <strong>BrAPI base-URL</strong>. 
          </p>
        </div>
      )
    }
    return '';
  };

  const handleBrapiTokens = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    // Get index of field name
    const index = parseInt(name.split('-')[1], 10);

    const updatedTokens = [...brapiTokens];
    updatedTokens[index] = value;
    setValue("metadataBrapiTokens", updatedTokens);
  };

  const toPascalCase = (str: string): string =>
    str
      .trim()
      .toLowerCase()
      .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => c ? c.toUpperCase() : "")
      .replace(/^(.)/, c => c.toUpperCase());

  const downloadExampleFile = async () => {
    let mandatoryMetadataFields: Record<string, Record<string, string>> | null = null;
    let endpoint = endpoints.MANDATORY_METADATA_URL;
    const metadataType = colNameMap[selectedIndSample];

    //Retrieve mandatory fields
    if (metadataSelectedDb != "") {
      endpoint = endpoint + "/" + metadataSelectedDb;
    }

    const resp = await api.get(endpoint);
    if (resp.status === 200) {
      mandatoryMetadataFields = resp.data;
    }    

    const mandatoryFieldObj: Record<string, string> | null = mandatoryMetadataFields?.[toPascalCase(metadataType)] ?? null;
    const mandatoryFieldNames: string[] = mandatoryFieldObj == null ? [] : Object.keys(mandatoryFieldObj).map(f => f.trim());

    //Build example file
    let content = "";
    for (let mandFieldName of mandatoryFieldNames) {
      const valuesRequired = mandFieldName.startsWith("*");
      const desc = mandatoryFieldObj![mandFieldName];
      if (valuesRequired) mandFieldName = mandFieldName.substring(1);
      content +=
        `# Mandatory column '${mandFieldName}'` +
        (valuesRequired ? " expecting non-blank values" : "") +
        (desc !== "" ? `: ${desc}` : "") +
        "\n";
    }

    if (mandatoryFieldNames.length !== 0) {
      content += "\n" + mandatoryFieldNames.map(col => col.replace("*", "")).join("\t");
    }
    content += "\tsome_field1\tsome_field2";

    const colCount = content.split("\t").length;

    for (let i = 1; i < 5; i++) {
      for (let j = 0; j < colCount; j++) {
        content += j === 0 ? `\n${metadataType}${i}` : `\tvalue${i}_${j}`;
      }
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `example_${metadataType}_metadata.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── Configuration ────────────────────── */}
      <div className="import-section import-section-primary">
        <div className="import-section-label">Configuration</div>

        {dbSelect && (
          <Form.Group controlId="database" as={Row} className="mb-3 align-items-center">
            <Form.Label column sm={3} className="import-metadata-label-right">
              Database<span className="import-metadata-required">*</span>
            </Form.Label>
            <Col sm="auto">
              <Controller
                name="metadataSelectedDb"
                control={control}
                rules={{ required: "La database est requise" }}
                render={({ field }) => (
                  <DatabaseSelect
                    {...field} // inject value and onchange automatically
                    newDb={false}
                    writable={false}
                  />
                )}
              />
            </Col>
          </Form.Group>
        )}

        <Form.Group controlId="ind_sample" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-metadata-label-right">Import metadata on</Form.Label>
          <Col sm="auto">
            <Form.Select {...register('metadataSelectedIndSample')}>
              <option value="1">individuals</option>
              <option value="2">samples</option>
            </Form.Select>
          </Col>
          <Col sm="auto">
            <a href="#" onClick={downloadExampleFile}>
              Download example file
            </a>
          </Col>
        </Form.Group>

        <Form.Group controlId="datasourceType" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={3} className="import-metadata-label-right">Datasource type</Form.Label>
          <Col sm="auto">
            <Form.Select {...register('metadataSelectedSourceType')}>
              <option value="1">File</option>
              <option value="2">BrAPI endpoint</option>
            </Form.Select>
          </Col>
        </Form.Group>

        {selectedMetaDataSourceType === '2' && (
          <Form.Group controlId="pull_brapi_select" as={Row} className="mb-3 align-items-center">
            <Form.Label column sm={3} className="import-metadata-label-right">Importing way</Form.Label>
            <Col sm={8}>
              <Form.Select {...register('metadataSelectedImportingWay')}>
                <option value="1">Pull all metadata from a unique BrAPI endpoint, based on provided identifiers</option>
                <option value="2">Specify in a file external source identifiers and BrAPI endpoint for each {colNameMap[selectedIndSample]}</option>
              </Form.Select>
            </Col>
          </Form.Group>
        )}
      </div>

      {/* ── File / BrAPI source ──────────────── */}
      {(selectedMetaDataSourceType === '1' || (selectedMetaDataSourceType === "2" && selectedImportingWay == "2")) && (
        <div className="import-section import-section-primary">
          <div className="import-section-label">File source</div>

          <Form.Group controlId="fileURL" as={Row} className="mb-3 align-items-center">
            <Form.Label column sm={3} className="import-metadata-label-right">File path or URL</Form.Label>
            <Col sm={6}>
              <Form.Control type="text" {...register('metadataFileUrl')} />
            </Col>
          </Form.Group>
          <div className="mb-3">
            <CustomDropZone
              files={files || []}
              allowedExtensions={['.csv', '.tsv']}
              helperText={getDropzoneMessage()}
              onChange={(files) =>
                setValue('metadataFiles', files, { shouldValidate: true })
              }
              customValidator={customValidator}
              validationDependencies={[metadataSelectedDb, selectedIndSample]}
            />
          </div>
        </div>
      )}

      {brapiUrls.length > 0 && (
        <div className="import-section">
          <div className="import-section-label">BrAPI tokens</div>
          {brapiUrls.map((url, index) => (
            <Form.Group controlId={`brapiEndpoint-${index}`} as={Row} className="mb-3 align-items-center" key={index}>
              <Form.Label column sm={3} className="import-metadata-label-right">
                Token for {url}
              </Form.Label>
              <Col sm={6}>
                <Form.Control
                  name={`brapiToken-${index}`}
                  type="text"
                  placeholder="Bearer ..."
                  value={brapiTokens[index]}
                  onChange={handleBrapiTokens}
                />
              </Col>
            </Form.Group>
          ))}
        </div>
      )}

      {(selectedMetaDataSourceType === '2' && selectedImportingWay == "1") && (
        <div className="import-section">
          <div className="import-section-label">BrAPI source</div>

          <Form.Group controlId="brapiEndpoint" as={Row} className="mb-3 align-items-center">
            <Form.Label column sm={3} className="import-metadata-label-right">BrAPI endpoint</Form.Label>
            <Col sm={6}>
              <Form.Control
                {...register('metadataBrapiEndpoint')}
                type="text"
                placeholder="https://test-server.brapi.org/brapi/v2"
              />
            </Col>
          </Form.Group>
          <Form.Group controlId="brapiToken" as={Row} className="mb-3 align-items-center">
            <Form.Label column sm={3} className="import-metadata-label-right">BrAPI token</Form.Label>
            <Col sm={6}>
              <Form.Control
                {...register('metadataBrapiToken')}
                type="text"
                placeholder="Bearer ..."
              />
            </Col>
          </Form.Group>
        </div>
      )}
    </div>
  )
}

export default ImportMetadataPart;