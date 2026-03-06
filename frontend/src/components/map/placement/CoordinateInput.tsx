import { useState, useCallback, useEffect } from 'react';
import { Copy } from 'lucide-react';
import {
  latLonToMGRS,
  mgrsToLatLon,
  isValidMGRS,
  isValidGPS,
  formatCoords,
} from '@/utils/coordinates';

interface CoordinateInputProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lon: number) => void;
  disabled?: boolean;
}

export default function CoordinateInput({
  latitude,
  longitude,
  onChange,
  disabled = false,
}: CoordinateInputProps) {
  const [mode, setMode] = useState<'gps' | 'mgrs'>('gps');
  const [latStr, setLatStr] = useState(latitude.toFixed(6));
  const [lonStr, setLonStr] = useState(longitude.toFixed(6));
  const [mgrsStr, setMgrsStr] = useState('');
  const [gpsError, setGpsError] = useState(false);
  const [mgrsError, setMgrsError] = useState(false);

  // Sync external changes
  useEffect(() => {
    setLatStr(latitude.toFixed(6));
    setLonStr(longitude.toFixed(6));
    try {
      setMgrsStr(latLonToMGRS(latitude, longitude));
    } catch {
      setMgrsStr('');
    }
  }, [latitude, longitude]);

  const handleGpsBlur = useCallback(() => {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon) || !isValidGPS(lat, lon)) {
      setGpsError(true);
      return;
    }
    setGpsError(false);
    onChange(lat, lon);
    try {
      setMgrsStr(latLonToMGRS(lat, lon));
    } catch {
      setMgrsStr('');
    }
  }, [latStr, lonStr, onChange]);

  const handleMgrsBlur = useCallback(() => {
    const trimmed = mgrsStr.trim();
    if (!trimmed || !isValidMGRS(trimmed)) {
      setMgrsError(true);
      return;
    }
    setMgrsError(false);
    const result = mgrsToLatLon(trimmed);
    setLatStr(result.lat.toFixed(6));
    setLonStr(result.lon.toFixed(6));
    onChange(result.lat, result.lon);
  }, [mgrsStr, onChange]);

  const handleCopy = useCallback(() => {
    const gps = formatCoords(latitude, longitude);
    let mgrs = '';
    try {
      mgrs = latLonToMGRS(latitude, longitude);
    } catch {
      // ignore
    }
    const text = mgrs ? `${gps}\n${mgrs}` : gps;
    navigator.clipboard.writeText(text).catch(() => {
      // clipboard may not be available
    });
  }, [latitude, longitude]);

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '6px 8px',
    backgroundColor: '#0f1219',
    border: `1px solid ${hasError ? '#f87171' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: 4,
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    outline: 'none',
    boxSizing: 'border-box' as const,
    opacity: disabled ? 0.5 : 1,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 3,
    fontFamily: "'JetBrains Mono', monospace",
  };

  const secondaryStyle: React.CSSProperties = {
    fontSize: 9,
    color: '#60a5fa',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 4,
  };

  return (
    <div className="mb-3">
      {/* Mode toggle */}
      <div
        className="flex items-center justify-between mb-2"
      >
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('gps')}
            disabled={disabled}
            className="py-[3px] px-2.5 rounded-[3px] text-[9px] font-bold tracking-[1px]" style={{ border: `1px solid ${mode === 'gps' ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`, backgroundColor: mode === 'gps' ? 'rgba(96, 165, 250, 0.15)' : 'transparent', color: mode === 'gps' ? '#60a5fa' : '#94a3b8', fontFamily: "'JetBrains Mono', monospace", cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            GPS
          </button>
          <button
            type="button"
            onClick={() => setMode('mgrs')}
            disabled={disabled}
            className="py-[3px] px-2.5 rounded-[3px] text-[9px] font-bold tracking-[1px]" style={{ border: `1px solid ${mode === 'mgrs' ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'}`, backgroundColor: mode === 'mgrs' ? 'rgba(96, 165, 250, 0.15)' : 'transparent', color: mode === 'mgrs' ? '#60a5fa' : '#94a3b8', fontFamily: "'JetBrains Mono', monospace", cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            MGRS
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="flex items-center gap-1 py-[3px] px-2 rounded-[3px] bg-transparent text-[#94a3b8] text-[9px]" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: "'JetBrains Mono', monospace", cursor: disabled ? 'not-allowed' : 'pointer' }}
          title="Copy coordinates"
        >
          <Copy size={10} />
          COPY
        </button>
      </div>

      {mode === 'gps' ? (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <div style={labelStyle}>LATITUDE</div>
              <input
                type="number"
                step="0.000001"
                value={latStr}
                onChange={(e) => setLatStr(e.target.value)}
                onBlur={handleGpsBlur}
                disabled={disabled}
                style={inputStyle(gpsError)}
              />
            </div>
            <div className="flex-1">
              <div style={labelStyle}>LONGITUDE</div>
              <input
                type="number"
                step="0.000001"
                value={lonStr}
                onChange={(e) => setLonStr(e.target.value)}
                onBlur={handleGpsBlur}
                disabled={disabled}
                style={inputStyle(gpsError)}
              />
            </div>
          </div>
          <div style={secondaryStyle}>
            MGRS: {mgrsStr || '---'}
          </div>
        </>
      ) : (
        <>
          <div>
            <div style={labelStyle}>MGRS GRID</div>
            <input
              type="text"
              value={mgrsStr}
              onChange={(e) => setMgrsStr(e.target.value.toUpperCase())}
              onBlur={handleMgrsBlur}
              disabled={disabled}
              placeholder="e.g. 11SMS1234567890"
              style={inputStyle(mgrsError)}
            />
          </div>
          <div style={secondaryStyle}>
            GPS: {formatCoords(latitude, longitude)}
          </div>
        </>
      )}
    </div>
  );
}
