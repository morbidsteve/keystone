import { useState } from 'react';
import type React from 'react';
import { MapPin, Copy, Package, Shield, Users, Clock, Check } from 'lucide-react';
import type { MapUnit } from '@/api/map';
import { latLonToMGRS } from '@/utils/coordinates';
import { formatRelativeTime } from '@/lib/utils';

interface UnitDetailPanelProps {
  data: MapUnit;
}

type Tab = 'supply' | 'equipment' | 'personnel' | 'history';

function getStatusColor(status: string): string {
  switch (status) {
    case 'GREEN':
      return '#4ade80';
    case 'AMBER':
      return '#fbbf24';
    case 'RED':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

function getReadinessColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  return '#f87171';
}

export function UnitDetailPanel({ data }: UnitDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('supply');
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'supply', label: 'Supply', icon: <Package size={12} /> },
    { key: 'equipment', label: 'Equipment', icon: <Shield size={12} /> },
    { key: 'personnel', label: 'Personnel', icon: <Users size={12} /> },
    { key: 'history', label: 'History', icon: <Clock size={12} /> },
  ];

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabRow}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'supply' && (
        <div style={styles.tabContent}>
          {/* Overall Status */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>SUPPLY STATUS</div>
            <div style={styles.statusRow}>
              <span style={styles.mutedText}>Overall Status</span>
              <span
                style={{
                  ...styles.statusPill,
                  backgroundColor: getStatusColor(data.supply_status),
                }}
              >
                {data.supply_status}
              </span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.mutedText}>Overall Readiness</span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: getReadinessColor(data.readiness_pct),
                }}
              >
                {Math.round(data.readiness_pct)}%
              </span>
            </div>
          </div>

          {/* Coordinates */}
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
              {data.position_source && (
                <div style={styles.coordRow}>
                  <span style={styles.coordLabel}>SOURCE</span>
                  <span style={{ ...styles.coordValue, color: '#60a5fa' }}>
                    {data.position_source}
                  </span>
                </div>
              )}
              {data.last_updated && (
                <div style={styles.coordRow}>
                  <span style={styles.coordLabel}>UPDATED</span>
                  <span style={styles.coordValue}>
                    {formatRelativeTime(data.last_updated)}
                  </span>
                </div>
              )}
            </div>
            <button onClick={handleCopyCoords} style={styles.copyBtn}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Coordinates'}</span>
            </button>
          </div>

          {/* Supply Breakdown */}
          {data.supply_breakdown && data.supply_breakdown.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>SUPPLY BREAKDOWN</div>
              {data.supply_breakdown.map((s) => (
                <div key={s.supply_class} style={styles.supplyRow}>
                  <div style={styles.supplyRowHeader}>
                    <span style={styles.supplyClassName}>
                      CL {s.supply_class} - {s.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={styles.mutedText}>
                        {Math.round(s.percentage)}% | {s.dos} DOS
                      </span>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(s.status),
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </div>
                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(100, s.percentage)}%`,
                        backgroundColor: getStatusColor(s.status),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inbound Convoys */}
          {data.inbound_convoys && data.inbound_convoys.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>INBOUND RESUPPLY</div>
              {data.inbound_convoys.map((cv) => (
                <div key={cv.convoy_id} style={styles.convoyCard}>
                  <div style={styles.convoyHeader}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 11 }}>
                      {cv.name}
                    </span>
                    <span
                      style={{
                        ...styles.statusPill,
                        backgroundColor: cv.status === 'EN_ROUTE' ? '#4ade80' : '#fbbf24',
                        fontSize: 8,
                        padding: '1px 6px',
                      }}
                    >
                      {cv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={styles.mutedText}>
                    ETA: {formatRelativeTime(cv.eta)} | {cv.cargo_summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div style={styles.tabContent}>
          {/* Readiness */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>EQUIPMENT READINESS</div>
            <div style={{ ...styles.statusRow, marginBottom: 12 }}>
              <span style={styles.mutedText}>Overall</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: getReadinessColor(data.readiness_pct),
                }}
              >
                {Math.round(data.readiness_pct)}%
              </span>
            </div>
          </div>

          {data.equipment_summary && data.equipment_summary.length > 0 ? (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>BY TYPE</div>
              {/* Table header */}
              <div style={styles.tableHeader}>
                <span style={{ flex: 2 }}>Type</span>
                <span style={{ flex: 1, textAlign: 'right' }}>MC</span>
                <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
                <span style={{ flex: 1, textAlign: 'right' }}>MC%</span>
              </div>
              {data.equipment_summary.map((eq) => (
                <div key={eq.type} style={styles.tableRow}>
                  <span style={{ flex: 2, color: '#e2e8f0' }}>{eq.type}</span>
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'right',
                      color: getReadinessColor(eq.readiness_pct),
                      fontWeight: 600,
                    }}
                  >
                    {eq.mission_capable}
                  </span>
                  <span style={{ flex: 1, textAlign: 'right', color: '#94a3b8' }}>
                    {eq.total}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'right',
                      color: getReadinessColor(eq.readiness_pct),
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(eq.readiness_pct)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.placeholder}>
              No equipment data available for this unit.
            </div>
          )}
        </div>
      )}

      {activeTab === 'personnel' && (
        <div style={styles.tabContent}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Users size={11} style={{ marginRight: 4 }} />
              PERSONNEL
            </div>
            <div style={styles.placeholder}>
              <Users size={32} style={{ color: '#334155', marginBottom: 8 }} />
              <div>Personnel data not yet available.</div>
              <div style={{ fontSize: 10, marginTop: 4, color: '#475569' }}>
                {data.name} | {data.echelon}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.tabContent}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Clock size={11} style={{ marginRight: 4 }} />
              ACTIVITY TIMELINE
            </div>
            <div style={styles.placeholder}>
              <Clock size={32} style={{ color: '#334155', marginBottom: 8 }} />
              <div>Timeline data not yet available.</div>
              {data.last_updated && (
                <div style={{ fontSize: 10, marginTop: 4, color: '#475569' }}>
                  Last update: {formatRelativeTime(data.last_updated)}
                </div>
              )}
            </div>
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
    height: '100%',
  },
  tabRow: {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 12,
    gap: 2,
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 4px',
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'color 0.2s, border-color 0.2s',
  },
  tabActive: {
    color: '#60a5fa',
    borderBottomColor: '#60a5fa',
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
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
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  mutedText: {
    fontSize: 10,
    color: '#94a3b8',
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
    minWidth: 55,
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
  supplyRow: {
    marginBottom: 8,
  },
  supplyRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  supplyClassName: {
    fontSize: 10,
    color: '#e2e8f0',
    fontWeight: 500,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  convoyCard: {
    padding: '8px 10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    marginBottom: 6,
    borderLeft: '2px solid #4ade80',
  },
  convoyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tableHeader: {
    display: 'flex',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: 9,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    display: 'flex',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: 11,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
};
