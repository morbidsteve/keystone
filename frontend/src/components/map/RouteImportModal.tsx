import { useState, useCallback, useRef } from 'react';
import { X, Upload, FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { uploadRouteFile } from '@/api/map';
import { useQueryClient } from '@tanstack/react-query';

const ACCEPTED_EXTENSIONS = '.geojson,.json,.kml,.kmz,.gpx,.csv';

export default function RouteImportModal() {
  const routeImportOpen = useMapStore((s) => s.routeImportOpen);
  const closeRouteImport = useMapStore((s) => s.closeRouteImport);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setFile(null);
    setIsUploading(false);
    setResult(null);
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    closeRouteImport();
  }, [reset, closeRouteImport]);

  const handleFile = useCallback((f: File) => {
    setError('');
    setResult(null);
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile],
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setError('');
    setIsUploading(true);

    try {
      const res = await uploadRouteFile(file);
      setResult({ count: res.count });
      queryClient.invalidateQueries({ queryKey: ['map', 'data'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import routes');
    } finally {
      setIsUploading(false);
    }
  }, [file, queryClient]);

  if (!routeImportOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: 440,
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#1a1f2e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#e2e8f0',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Upload size={14} />
            IMPORT ROUTES
          </span>
          <button
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              border: 'none',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          {/* Success state */}
          {result && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              <CheckCircle2
                size={36}
                style={{ color: '#4ade80', marginBottom: 12 }}
              />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginBottom: 4,
                }}
              >
                Import Successful
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                }}
              >
                {result.count} route{result.count !== 1 ? 's' : ''} created
              </div>
              <button
                onClick={handleClose}
                style={{
                  marginTop: 16,
                  padding: '7px 20px',
                  border: '1px solid #60a5fa',
                  borderRadius: 4,
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  color: '#60a5fa',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                CLOSE
              </button>
            </div>
          )}

          {/* Upload state */}
          {!result && (
            <>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '28px 16px',
                  border: `2px dashed ${isDragging ? '#60a5fa' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: 6,
                  backgroundColor: isDragging
                    ? 'rgba(96, 165, 250, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: 12,
                }}
              >
                {isUploading ? (
                  <Loader2
                    size={28}
                    style={{
                      color: '#60a5fa',
                      marginBottom: 8,
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                ) : (
                  <FileUp
                    size={28}
                    style={{
                      color: isDragging ? '#60a5fa' : '#64748b',
                      marginBottom: 8,
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 11,
                    color: '#e2e8f0',
                    marginBottom: 4,
                  }}
                >
                  {file
                    ? file.name
                    : isDragging
                      ? 'Drop file here'
                      : 'Click or drag to upload'}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: '#64748b',
                  }}
                >
                  Supported: GeoJSON, JSON, KML, KMZ, GPX, CSV
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    borderRadius: 4,
                    color: '#f87171',
                    fontSize: 10,
                    marginBottom: 12,
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  style={{
                    padding: '7px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  style={{
                    padding: '7px 16px',
                    border: '1px solid #60a5fa',
                    borderRadius: 4,
                    backgroundColor: 'rgba(96, 165, 250, 0.15)',
                    color: '#60a5fa',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: !file || isUploading ? 'not-allowed' : 'pointer',
                    opacity: !file || isUploading ? 0.5 : 1,
                  }}
                >
                  {isUploading ? 'UPLOADING...' : 'IMPORT'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spin animation for loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
