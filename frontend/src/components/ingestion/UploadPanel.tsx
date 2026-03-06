import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Check, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function UploadPanel() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const acceptedTypes = ['.txt', '.csv', '.xlsx', '.xls'];

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList)
      .filter((f) => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        return acceptedTypes.includes(ext);
      })
      .map((f) => ({
        file: f,
        status: 'pending' as const,
        progress: 0,
      }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const simulateUpload = useCallback((index: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const, progress: 0 } : f)),
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        clearInterval(interval);
        setFiles((prev) => {
          const fileName = prev[index]?.file.name ?? 'File';
          toast.success(`Data ingested successfully: ${fileName}`);
          return prev.map((f, i) =>
            i === index ? { ...f, status: 'success' as const, progress: 100 } : f,
          );
        });
      } else {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress: Math.min(progress, 95) } : f)),
        );
      }
    }, 300);
  }, [toast]);

  const uploadAll = useCallback(() => {
    files.forEach((f, i) => {
      if (f.status === 'pending') {
        setTimeout(() => simulateUpload(i), i * 200);
      }
    });
  }, [files, simulateUpload]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Card title="DATA UPLOAD">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-[var(--radius)] py-8 px-6 text-center cursor-pointer mb-4" style={{ border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, backgroundColor: isDragging ? 'rgba(77, 171, 247, 0.05)' : 'transparent', transition: 'all var(--transition)' }}
      >
        <Upload
          size={28}
          className="mb-2" style={{ color: isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
        />
        <div
          className="font-[var(--font-mono)] text-xs text-[var(--color-text)] mb-1"
        >
          DROP FILES HERE OR CLICK TO BROWSE
        </div>
        <div
          className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] tracking-[0.5px]"
        >
          Accepted: .txt (mIRC), .csv, .xlsx
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <>
          <div className="flex flex-col gap-1.5 mb-3">
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                className="flex items-center gap-2.5 py-2 px-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)]"
              >
                <FileText size={14} className="text-[var(--color-text-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {f.file.name}
                  </div>
                  {f.status === 'uploading' && (
                    <div
                      className="mt-1 h-[3px] bg-[var(--color-bg)] rounded-[2px] overflow-hidden"
                    >
                      <div
                        className="h-full bg-[var(--color-accent)]" style={{ width: `${f.progress}%`, transition: 'width 0.3s ease' }}
                      />
                    </div>
                  )}
                </div>
                <span
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                >
                  {(f.file.size / 1024).toFixed(1)} KB
                </span>
                {f.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="bg-transparent border-0 cursor-pointer text-[var(--color-text-muted)] p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
                {f.status === 'uploading' && (
                  <Loader size={14} className="animate-spin text-[var(--color-accent)]" />
                )}
                {f.status === 'success' && (
                  <Check size={14} className="text-[var(--color-success)]" />
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {files.some((f) => f.status === 'pending') && (
            <button
              onClick={uploadAll}
              className="w-full bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-xs font-semibold tracking-[2px] uppercase cursor-pointer" style={{ padding: '10px', transition: 'opacity var(--transition)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              UPLOAD {files.filter((f) => f.status === 'pending').length} FILES
            </button>
          )}
        </>
      )}
    </Card>
  );
}
