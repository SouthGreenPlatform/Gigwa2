import Dropzone from 'react-dropzone';
import { Alert } from 'react-bootstrap';
import { CloudArrowUp } from 'react-bootstrap-icons';
import FileCard from './FileCard';
import { useEffect, useState } from 'react';

interface FileStatus {
  file: File;
  valid: boolean;
  error?: string;
}

interface CustomDropZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  customValidator?: (files: File[]) => Promise<string | null>;
  validationDependencies?: any[];
  allowedExtensions: string[];
  multiple?: boolean;
  helperText?: React.ReactNode;
  maxUploadSize?: number;
}

export function CustomDropZone({
  files,
  onChange,
  customValidator,
  validationDependencies = [],
  allowedExtensions,
  multiple = true,
  helperText,
  maxUploadSize = 200 //Megabytes
}: CustomDropZoneProps) {

  const MAX_FILE_SIZE = maxUploadSize * 1024 * 1024;

  const [filesStatus, setFilesStatus] = useState<FileStatus[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);

  // update file status whenever files changes
  useEffect(() => {
    const status = (files || []).map(file => {
      if (customError) {
        return { file, valid: false };
      } else {
        const valid = allowedExtensions.some(ext =>
          file.name.toLowerCase().endsWith(ext)
        );

        let error: string | undefined;
        if (valid) {
          error = `Expected: ${allowedExtensions.join(', ')}`;
        } else if (file.size > MAX_FILE_SIZE) {
          error = 'File size must be ≤ 200 MB';
        }

        return { file, valid, error };
      }
    });

    setFilesStatus(status);
  }, [files, customError]);

  // trigger customValidator when files or parent params change (used in metadata part)
  useEffect(() => {
    setCustomError(null);
    if (!customValidator || files.length === 0) return;  
    const runValidation = async () => {
      const error = await customValidator(files);
      setCustomError(error);      
    };
    runValidation();
  }, [files, customValidator, ...validationDependencies]);

  // update files anytime there is a new file
  const onDrop = async (acceptedFiles: File[]) => {
    // Clear previous error
    setCustomError(null);

    // Combine existing files with new ones
    const allFiles = multiple
      ? [...(files || []), ...acceptedFiles]
      : acceptedFiles.slice(0, 1);
    onChange(allFiles);
  };

  const removeFile = (file: File) => {
    onChange((files || []).filter(f => f !== file));
  };

  return (
    <Dropzone onDrop={onDrop} multiple={multiple}>
      {({ getRootProps, getInputProps }) => (
        <div {...getRootProps()} className="import-dropzone">
          <input {...getInputProps()} />

          <CloudArrowUp className="import-dropzone-icon" />

          <p className="import-dropzone-title">
            Drag & drop files here, or{' '}
            <span className="import-dropzone-browse">browse</span>
          </p>

          {helperText && (
            <div className="import-dropzone-hint">{helperText}</div>
          )}

          {filesStatus.length > 0 && (
            <div
              className="import-dropzone-files d-flex flex-wrap gap-2 justify-content-center"
              onClick={(e) => e.stopPropagation()}
            >
              {filesStatus.map(status => (
                <FileCard
                  key={status.file.name}
                  status={status}
                  onRemove={() => removeFile(status.file)}
                />
              ))}
            </div>
          )}

          {customError && (
            <Alert variant="danger" className="mt-3 mb-0 text-start">
              {customError}
            </Alert>
          )}
        </div>
      )}
    </Dropzone>
  );
}
