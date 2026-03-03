import { useState } from 'react';
import type React from 'react';
import { AlertTriangle, MapPin, Copy, Check, Info } from 'lucide-react';
import type { MapAlert } from '@/api/map';
import { latLonToMGRS } from '@/utils/coordinates';

interface AlertDetailPanelProps {
  data: MapAlert;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '#f87171';
    case 'WARNING':
      return '#fbbf24';
    case 'INFO':
      return '#60a5fa';
    default:
      return '#94a3b8';
  }
}

function getAlertTypeLabel(type: string): string {
  switch (type) {
    case 'SUPPLY_CRITICAL':
      return 'SUPPLY CRITICAL';
    case 'SUPPLY_LOW':
      return 'SUPPLY LOW';
    case 'EQUIPMENT_DOWN':
      return 'EQUIPMENT DOWN';
    case 'READINESS_DROP':
      return 'READINESS DROP';
    case 'MOVEMENT_DELAYED':
      return 'MOVEMENT DELAYED';
    case 'INGESTION_ERROR':
      return 'INGESTION ERROR';
    case 'SYSTEM':
      return 'SYSTEM';
    default:
      return type;
  }
}

export function AlertDetailPanel({ data }: AlertDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  const hasPosition = data.latitude !== 0 || data.longitude !== 0;
  const mgrs = hasPosition ? latLonToMGRS(data.latitude, data.longitude) : null;
  const gps = hasPosition
    ? `${Math.abs(data.latitude).toFixed(6)}${data.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(data.longitude).toFixed(6)}${data.longitude >= 0 ? 'E' : 'W'}`
    : null;

  const handleCopyCoords = () => {
    if (!hasPosition) return;
    const text = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)} | MGRS: ${mgrs}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const severityColor = getSeverityColor(data.severity);

  return (
    <div style={styles.container}>
      {/* Severity Banner */}
      <div
        style={{
          ...styles.severityBanner,
          backgroundColor: `${severityColor}15`,
          borderColor: `${severityColor}40`,
        }}
      >
        <AlertTriangle size={14} style={{ color: severityColor, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: severityColor, letterSpacing: '1px' }}>
            {data.severity}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>
            {getAlertTypeLabel(data.alert_type)}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Info size={11} style={{ marginRight: 4 }} />
          DETAILS
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Alert Type</span>
          <span style={styles.detailValue}>{getAlertTypeLabel(data.alert_type)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Severity</span>
          <span
            style={{
              ...styles.statusPill,
              backgroundColor: severityColor,
            }}
          >
            {data.severity}
          </span>
        </div>
        {data.unit_name && (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Unit</span>
            <span style={styles.detailValue}>{data.unit_name}</span>
          </div>
        )}
      </div>

      {/* Message */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>MESSAGE</div>
        <div
          style={{
            ...styles.messageBlock,
            borderLeftColor: `${severityColor}60`,
          }}
        >
          {data.message}
        </div>
      </div>

      {/* Position */}
      {hasPosition && mgrs && gps && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <MapPin size={11} style={{ marginRight: 4 }} />
            POSITION
          </div>
          <div style={styles.coordBlock}>
            <div style={styles.coordRow}>
              <span style={styles.coordLabel}>GPS</span>
              <span style={styles.coordValue}>{gps}</span>
            </div>
            <div style={styles.coordRow}>
              <span style={styles.coordLabel}>MGRS</span>
              <span style={styles.coordValue}>{mgrs}</span>
            </div>
          </div>
          <button onClick={handleCopyCoords} style={styles.copyBtn}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Coordinates'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  severityBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 4,
    border: '1px solid',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: '#60a5fa',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    display: 'flex',
    alignItems: 'center',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 11,
    color: '#e2e8f0',
    fontWeight: 600,
  },
  statusPill: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1px',
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  messageBlock: {
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 1.5,
    borderLeft: '2px solid',
  },
  coordBlock: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    padding: '8px 10px',
    marginBottom: 8,
  },
  coordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: 10,
  },
  coordLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    minWidth: 45,
  },
  coordValue: {
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#60a5fa',
    backgroundColor: 'rgba(96,165,250,0.1)',
    border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 4,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
  },
};
