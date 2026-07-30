import { X, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';

interface FileCardProps {
  status: {
    file: File;
    valid: boolean;
    error?: string;
  };
  onRemove: () => void;
}

function FileCard({ status, onRemove }: FileCardProps) {
  const { file, valid } = status;

  return (
    <div className={`import-file-card ${valid ? 'valid' : 'invalid'}`}>
      {valid
        ? <CheckCircleFill size={12} className="flex-shrink-0" />
        : <XCircleFill size={12} className="flex-shrink-0" />
      }
      <span className="import-file-name" title={file.name}>{file.name}</span>
      <span className="import-file-size">{(file.size / 1024).toFixed(1)} KB</span>
      <button
        className="import-file-remove"
        onClick={onRemove}
        title="Remove file"
        type="button"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default FileCard;
