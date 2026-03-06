import { useState, useCallback, useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!routeImportOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [routeImportOpen, handleClose]);

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
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.5)] inset-0 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-[440px] max-h-[80vh] overflow-y-auto bg-[#1a1f2e] rounded-[8px]" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 border-b border-b-[rgba(255,255,255,0.1)]"
        >
          <span
            className="text-[11px] font-bold tracking-[2px] text-[#e2e8f0] uppercase flex items-center gap-2"
          >
            <Upload size={14} />
            IMPORT ROUTES
          </span>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-[28px] h-[28px] border-0 rounded-[4px] bg-transparent text-[#94a3b8] cursor-pointer"
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
        <div className="p-4">
          {/* Success state */}
          {result && (
            <div
              className="text-center mb-3" style={{ padding: '20px' }}
            >
              <CheckCircle2
                size={36}
                className="text-[#4ade80] mb-3"
              />
              <div
                className="text-[13px] font-bold text-[#e2e8f0] mb-1"
              >
                Import Successful
              </div>
              <div
                className="text-[11px] text-[#94a3b8]"
              >
                {result.count} route{result.count !== 1 ? 's' : ''} created
              </div>
              <button
                onClick={handleClose}
                className="mt-4 py-[7px] px-5 rounded-[4px] bg-[rgba(96,165,250,0.15)] text-[#60a5fa] text-[10px] font-bold tracking-[1px] cursor-pointer" style={{ border: '1px solid #60a5fa', fontFamily: "'JetBrains Mono', monospace" }}
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
                className="py-7 px-4 rounded-[6px] text-center cursor-pointer mb-3" style={{ border: `2px dashed ${isDragging ? '#60a5fa' : 'rgba(255, 255, 255, 0.12)'}`, backgroundColor: isDragging
                    ? 'rgba(96, 165, 250, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)', transition: 'all 0.15s ease' }}
              >
                {isUploading ? (
                  <Loader2
                    size={28}
                    className="text-[#60a5fa] mb-2 animate-spin"
                  />
                ) : (
                  <FileUp
                    size={28}
                    className="mb-2" style={{ color: isDragging ? '#60a5fa' : '#64748b' }}
                  />
                )}
                <div
                  className="text-[11px] text-[#e2e8f0] mb-1"
                >
                  {file
                    ? file.name
                    : isDragging
                      ? 'Drop file here'
                      : 'Click or drag to upload'}
                </div>
                <div
                  className="text-[9px] text-[#64748b]"
                >
                  Supported: GeoJSON, JSON, KML, KMZ, GPX, CSV
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 py-2 px-2.5 bg-[rgba(248,113,113,0.1)] rounded-[4px] text-[#f87171] text-[10px] mb-3 border border-[rgba(248,113,113,0.3)]"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div
                className="flex gap-2 justify-end pt-2 border-t border-t-[rgba(255,255,255,0.08)]"
              >
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  className="py-[7px] px-4 rounded-[4px] bg-transparent text-[#94a3b8] text-[10px] font-semibold tracking-[1px] cursor-pointer" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="py-[7px] px-4 rounded-[4px] bg-[rgba(96,165,250,0.15)] text-[#60a5fa] text-[10px] font-bold tracking-[1px]" style={{ border: '1px solid #60a5fa', fontFamily: "'JetBrains Mono', monospace", cursor: !file || isUploading ? 'not-allowed' : 'pointer', opacity: !file || isUploading ? 0.5 : 1 }}
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
