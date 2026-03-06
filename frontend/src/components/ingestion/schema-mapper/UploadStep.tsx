import { useState } from 'react';
import { Upload, Loader } from 'lucide-react';

interface UploadStepProps {
  isLoading: boolean;
  onUpload: (file: File) => void;
}

export default function UploadStep({ isLoading, onUpload }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files[0]);
      }}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = (ev) => {
          const files = (ev.target as HTMLInputElement).files;
          if (files && files.length > 0) onUpload(files[0]);
        };
        input.click();
      }}
      className="rounded-[var(--radius)] py-12 px-6 text-center" style={{ border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, cursor: isLoading ? 'wait' : 'pointer', backgroundColor: isDragging ? 'rgba(77, 171, 247, 0.05)' : 'transparent', transition: 'all var(--transition)' }}
    >
      {isLoading ? (
        <Loader size={32} className="animate-spin text-[var(--color-accent)] mx-auto mb-3" />
      ) : (
        <Upload
          size={32}
          style={{ color: isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)', margin: '0 auto 12px' }}
        />
      )}
      <div className="font-[var(--font-mono)] text-xs text-[var(--color-text)] mb-1">
        {isLoading ? 'ANALYZING FILE...' : 'DROP FILE HERE OR CLICK TO BROWSE'}
      </div>
      <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] tracking-[0.5px]">
        Upload a data file to map its columns to KEYSTONE fields
      </div>
      <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1">
        Accepted: .xlsx, .xls, .csv
      </div>
    </div>
  );
}
