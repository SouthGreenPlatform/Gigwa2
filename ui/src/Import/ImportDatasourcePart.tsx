import { Form, Col, Row, Button } from 'react-bootstrap';
import { useState } from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { CustomDropZone } from './CustomDropZone';
import '../styles/import-datasource-part.scss';

const allowedExtensions: { [key: string]: string[] } = {
  '1': ['.vcf', '.vcf.gz'],          // VCF
  '2': ['.hapmap', '.txt'],          // Hapmap
  '3': ['.ped', '.map'],             // PLINK
  '4': ['.intertek'],                // Intertek
  '5': ['.genotype', '.map'],        // Flapjack
  '6': ['.dart'],                    // DArTseq
  //'7': ['.tsv', '.csv']               // mapping file
};

// For info message to the user
const fileFormatMap: { [key: string]: string } = {
  '1': '.vcf or .vcf.gz',
  '2': '.hapmap or .txt',
  '3': '.ped and .map',
  '4': '.intertek',
  '5': '.genotype and .map',
  '6': '.dart'
};

//Specify validation schema
export const Step2Schema = z.object({
  selectedIndSample: z.string().nonempty(),
  selectedMapping: z.string().optional(),
  selectedDataSourceType: z.string().nonempty(),
  selectedFileFormat: z.string().optional(),
  fileUrl: z.string().optional(),
  fileUrl2: z.string().optional(),
  brapiEndpoint: z.string().optional(),
  brapiToken: z.string().optional(),
  mappingFile: z.array(z.any()).optional(),
  files: z.array(z.any()).optional(),
  selectedBrapiMap: z.string().optional(),
  selectedBrapiStudy: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.selectedDataSourceType === '1') {
    const hasFile = (data.fileUrl && data.fileUrl.trim() !== '') || (data.files && data.files.length > 0);
    if (!hasFile) {
      ctx.addIssue({
        path: ["fileUrl"],
        code: z.ZodIssueCode.custom,
        message: 'Genotyping data: Either file URL or a file upload is required.',
      });
    }
 
    if (data.selectedIndSample === "2") {
      if (data.selectedMapping === "1") {      
        // if (!(data.mappingFile && data.mappingFile.length > 0)) {
        //   // mapping file .tsv or .csv
        //   ctx.addIssue({
        //     path: ["mappingFile"],
        //     code: z.ZodIssueCode.custom,
        //     message: 'A mapping sample-individual file is required.',
        //   });
        // } else {
        if (data.mappingFile) {
          const ext = data.mappingFile[0].name.slice(data.mappingFile[0].name.lastIndexOf('.')).toLowerCase();
          if (!['.tsv', '.csv'].includes(ext)) {
              ctx.addIssue({
              path: ["mappingFile"],
              code: z.ZodIssueCode.custom,
              message: `The mapping file has invalid format. Expected: .csv or .tsv`,
            });
          }
        }
      } else {
        //Brapi mapping
      }
    }

    // Valid files format
    if (data.files && data.files.length > 0 && data.selectedFileFormat) {
      const expectedExts = allowedExtensions[data.selectedFileFormat];

      if (data.selectedIndSample === "2" && data.selectedMapping === "1") {
        //need mapping file .tsv or .csv
        expectedExts.push(".csv", "tsv");
      }

      const invalidFiles = data.files.filter((file: File) => {
        const name = file.name.toLowerCase();
        return !expectedExts.some(ext => name.endsWith(ext));
      });

      if (invalidFiles.length > 0) {
        ctx.addIssue({
          path: ["files"],
          code: z.ZodIssueCode.custom,
          message: `Some files have invalid formats. Expected: ${expectedExts.join(', ')}`,
        });
      }
    }  

  } else if (data.selectedDataSourceType === '2') {
    if (!data.selectedMapping || data.selectedMapping === "") {
      ctx.addIssue({
      code: "custom",
      message: "selectedMapping is required",
      path: ["selectedMapping"],
    });
    }
  }
});

export interface Step2FormValues extends z.infer<typeof Step2Schema> {}

export interface GenMap {
  mapDbId: string;
  name: string;
  markerCount: number;
}

export class Study {
  studyDbId: string;
  name: string;
  samplesNumber: number;

  // Constructeur pour la classe
  constructor(studyDbId: string, name: string, samplesNumber: number) {
    this.studyDbId = studyDbId;
    this.name = name;
    this.samplesNumber = samplesNumber;
  }
}

interface ImportDatasourcePartComponentProps {
  maxUploadSize: string | null;
}

function ImportDatasourcePart({ maxUploadSize }: ImportDatasourcePartComponentProps) {
  const { register, watch, setValue, getValues } = useFormContext<Step2FormValues>();

  const selectedDataSourceType = useWatch({name: 'selectedDataSourceType'});
  const brapiEndpoint = useWatch({name: 'brapiEndpoint'});
  const brapiToken = useWatch({name: 'brapiToken'});
  const selectedFileFormat = useWatch({name: 'selectedFileFormat'});
  const selectedIndSample = useWatch({name: 'selectedIndSample'});
  const files = useWatch({name: 'files'});
  const mappingFile = useWatch({name: 'mappingFile'});
  const selectedMapping = useWatch({name: 'selectedMapping'});
  
  const [maps, setMaps] = useState<Map<string, GenMap>>(new Map());
  const [studies, setStudies] = useState<Map<string, Study>>(new Map());

  //Look for BrAPI studies to import
  const handleClick = async () => {

    if (!brapiEndpoint) return;

    const headers = {
      'Content-Type': 'application/json',
      ...(brapiToken ? { Authorization: `Bearer ${brapiToken}` } : {})
    };

    const brapi = axios.create({
      baseURL: brapiEndpoint,
      headers: headers
    });

    try {
      await brapi.get('calls');
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert(`No BrAPI source found at ${brapiEndpoint}`);
        return;
      }
    }

    // Load maps
    const mapsRes = await brapi.get('maps');
    if (mapsRes.status === 200) {
      const genMaps: Map<string, GenMap> = new Map(
        mapsRes.data.result.data.map((map: GenMap) => [map.mapDbId, map])
      );
      setMaps(genMaps);
      setValue('selectedBrapiMap', genMaps.keys().next().value);
    }

    // Load studies
    const studiesRes = await brapi.get('studies-search?pageSize=1000&studyType=genotype');
    if (studiesRes.status === 200) {
      const brapiStudies = studiesRes.data.result.data;
      const studiesMap = new Map<string, Study>();

      await Promise.all(
        brapiStudies.map(async (study: any) => {
          const profileRes = await brapi.get(`markerprofiles?studyDbId=${study.studyDbId}`);
          if (profileRes.status === 200) {
            const samplesNumber = profileRes.data.result.data.length;
            studiesMap.set(study.studyDbId, new Study(study.studyDbId, study.name, samplesNumber));
          }
        })
      );

      setStudies(studiesMap);
      setValue('selectedBrapiStudy', studiesMap.keys().next().value);
    }

  };

  const getDropzoneMessage = () => {
    const format = selectedFileFormat;
    if (format === '3' || format === '5') {
      return <>You must select 2 files: <strong>{fileFormatMap[format]}</strong></>;
    } else if (format) {
      return <>You must select a <strong>{fileFormatMap[format]}</strong> file</>;
    }
    return '';
  };

  return (
    <div>
      {/* ── Sample type ──────────────────────── */}
      <div className="import-section import-section-primary">
        <div className="import-section-label">Sample type</div>

        <Form.Group controlId="ind_sample" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={4} className="import-datasource-label-right">Genotypes are provided for</Form.Label>
          <Col sm="auto">
            <Form.Select {...register('selectedIndSample')}>
              <option value="1">individuals</option>
              <option value="2">samples</option>
            </Form.Select>
          </Col>
        </Form.Group>

        {selectedIndSample === '2' && (
          <Form.Group controlId="selectedMapping" as={Row} className="mb-3 align-items-center">
            <Form.Label column sm={4} className="import-datasource-label-right">Mapping samples to individuals with</Form.Label>
            <Col sm="auto">
              <Form.Select {...register('selectedMapping')}>
                <option value="1">Mapping file</option>
                <option value="2">BrAPI</option>
              </Form.Select>
            </Col>
          </Form.Group>
        )}

        {selectedMapping === '1' && selectedIndSample === '2' && (
          <div className="mb-3">
            <CustomDropZone
              files={mappingFile || []}
              multiple={false}
              allowedExtensions={['.csv', '.tsv']}
              helperText="Sample–individual mapping file (.csv or .tsv)"
              onChange={(files) =>
                setValue('mappingFile', files, { shouldValidate: true })
              }
            />
          </div>
        )}
      </div>

      {/* ── Datasource ───────────────────────── */}
      <div className="import-section import-section-primary">
        <div className="import-section-label">
          {selectedDataSourceType === '2' ? 'BrAPI source' : 'File source'}
        </div>

        <Form.Group controlId="datasourceType" as={Row} className="mb-3 align-items-center">
          <Form.Label column sm={4} className="import-datasource-label-right">Datasource type</Form.Label>
          <Col sm="auto">
            <Form.Select {...register('selectedDataSourceType')}>
              <option value="1">File</option>
              <option value="2">BrAPI endpoint</option>
            </Form.Select>
          </Col>
          <Col>
            {(selectedIndSample === '2' && selectedMapping === '2') && (
              <i className="import-info-note">You will have to specify a BrAPI endpoint in Metadata part</i>
            )}
            {selectedDataSourceType === '1' && (
              <i className="import-info-note">You may upload up to {maxUploadSize} Mb</i>
            )}
          </Col>
        </Form.Group>

        {selectedDataSourceType === '1' && (
          <>
            <Form.Group controlId="fileFormat" as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4} className="import-datasource-label-right">File format</Form.Label>
              <Col sm={4}>
                <Form.Select {...register('selectedFileFormat')}>
                  <option value="1">VCF</option>
                  <option value="2">Hapmap</option>
                  <option value="3">PLINK</option>
                  <option value="4">Intertek</option>
                  <option value="5">Flapjack</option>
                  <option value="6">DArTseq</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4} className="import-datasource-label-right">File URL</Form.Label>
              <Col sm={8}>
                <Form.Control {...register('fileUrl')} placeholder="http URL or path" />
              </Col>
            </Form.Group>

            {(selectedFileFormat === '3' || selectedFileFormat === '5') && (
              <Form.Group as={Row} className="mb-3 align-items-center">
                <Form.Label column sm={4} className="import-datasource-label-right">2nd File URL</Form.Label>
                <Col sm={8}>
                  <Form.Control {...register('fileUrl2')} placeholder="Second URL" />
                </Col>
              </Form.Group>
            )}

            <div className="mb-3">
              <CustomDropZone
                files={files || []}
                allowedExtensions={allowedExtensions[selectedFileFormat] || []}
                helperText={getDropzoneMessage()}
                onChange={(files) =>
                  setValue('files', files, { shouldValidate: true })
                }
              />
            </div>
          </>
        )}

        {selectedDataSourceType === '2' && (
          <>
            <Form.Group controlId="brapiEndpoint" as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4} className="import-datasource-label-right">Endpoint URL</Form.Label>
              <Col sm={5}>
                <Form.Control {...register('brapiEndpoint')} placeholder="https://test-server.brapi.org/brapi/v1" />
              </Col>
              <Col sm={3}>
                <Button variant="primary" onClick={handleClick}>Look for studies</Button>
              </Col>
            </Form.Group>
            <Form.Group controlId="brapiToken" as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4} className="import-datasource-label-right">BrAPI token</Form.Label>
              <Col sm={5}>
                <Form.Control {...register('brapiToken')} placeholder="Bearer ..." />
              </Col>
            </Form.Group>
            <Form.Group controlId="brapiMaps" as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4} className="import-datasource-label-right">Map</Form.Label>
              <Col sm={5}>
                <Form.Select {...register('selectedBrapiMap')}>
                  {[...maps.entries()].map(([id, map]) => (
                    <option key={id} value={id}>
                      {`${map.name} (${map.markerCount})`}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group controlId="brapiStudies" as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4} className="import-datasource-label-right">Study</Form.Label>
              <Col sm={5}>
                <Form.Select {...register('selectedBrapiStudy')}>
                  {[...studies.entries()].map(([id, study]) => (
                    <option key={id} value={id}>
                      {`${study.name} (${study.samplesNumber})`}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
          </>
        )}
      </div>
    </div>
  )
}

export default ImportDatasourcePart;