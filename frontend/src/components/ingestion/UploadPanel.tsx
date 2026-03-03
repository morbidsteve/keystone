import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Check, Loader } from 'lucide-react';
import Card from '@/components/ui/Card';

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
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: 'success' as const, progress: 100 } : f,
          ),
        );
      } else {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress: Math.min(progress, 95) } : f)),
        );
      }
    }, 300);
  }, []);

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
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
          borderRadius: 'var(--radius)',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'rgba(77, 171, 247, 0.05)' : 'transparent',
          transition: 'all var(--transition)',
          marginBottom: 16,
        }}
      >
        <Upload
          size={28}
          style={{
            color: isDragging ? 'var(--color-accent)' : 'var(--color-text-muted)',
            marginBottom: 8,
          }}
        />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-text)',
            marginBottom: 4,
          }}
        >
          DROP FILES HERE OR CLICK TO BROWSE
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.5px',
          }}
        >
          Accepted: .txt (mIRC), .csv, .xlsx
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <FileText size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {f.file.name}
                  </div>
                  {f.status === 'uploading' && (
                    <div
                      style={{
                        marginTop: 4,
                        height: 3,
                        backgroundColor: 'var(--color-bg)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${f.progress}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-accent)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {(f.file.size / 1024).toFixed(1)} KB
                </span>
                {f.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      padding: 2,
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
                {f.status === 'uploading' && (
                  <Loader size={14} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                )}
                {f.status === 'success' && (
                  <Check size={14} style={{ color: 'var(--color-success)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {files.some((f) => f.status === 'pending') && (
            <button
              onClick={uploadAll}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--color-accent)',
                border: 'none',
                borderRadius: 'var(--radius)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'opacity var(--transition)',
              }}
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
