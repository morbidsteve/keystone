import { useState } from 'react';
import type React from 'react';
import { MapPin, Copy, Check, Building2 } from 'lucide-react';
import type { MapSupplyPoint } from '@/api/map';
import { latLonToMGRS } from '@/utils/coordinates';

interface SupplyPointDetailPanelProps {
  data: MapSupplyPoint;
}

function getPointTypeLabel(type: string): string {
  switch (type) {
    case 'LOG_BASE':
      return 'LOGISTICS BASE';
    case 'SUPPLY_POINT':
      return 'SUPPLY POINT';
    case 'FARP':
      return 'FARP';
    case 'LZ':
      return 'LANDING ZONE';
    case 'AMMO_SUPPLY_POINT':
      return 'AMMO SUPPLY POINT';
    case 'WATER_POINT':
      return 'WATER POINT';
    case 'MAINTENANCE_COLLECTION_POINT':
      return 'MAINTENANCE CP';
    case 'BEACH':
      return 'BEACH';
    case 'PORT':
      return 'PORT';
    default:
      return type;
  }
}

function getSpStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return '#4ade80';
    case 'PLANNED':
      return '#fbbf24';
    case 'INACTIVE':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

export function SupplyPointDetailPanel({ data }: SupplyPointDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  const mgrs = latLonToMGRS(data.latitude, data.longitude);
  const gps = `${Math.abs(data.latitude).toFixed(6)}${data.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(data.longitude).toFixed(6)}${data.longitude >= 0 ? 'E' : 'W'}`;

  const handleCopyCoords = () => {
    const text = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)} | MGRS: ${mgrs}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.container}>
      {/* Details */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Building2 size={11} className="mr-1" />
          DETAILS
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Type</span>
          <span style={styles.detailValue}>{getPointTypeLabel(data.point_type)}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Status</span>
          <span
            style={{
              ...styles.statusPill,
              backgroundColor: getSpStatusColor(data.status),
            }}
          >
            {data.status}
          </span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Operating Unit</span>
          <span style={styles.detailValue}>{data.parent_unit_name}</span>
        </div>
      </div>

      {/* Coordinates */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <MapPin size={11} className="mr-1" />
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

      {/* Capacity Notes */}
      {data.capacity_notes && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>CAPACITY NOTES</div>
          <div style={styles.notesBlock}>
            {data.capacity_notes}
          </div>
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
  notesBlock: {
    padding: '8px 10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.5,
    borderLeft: '2px solid rgba(96,165,250,0.3)',
  },
};
