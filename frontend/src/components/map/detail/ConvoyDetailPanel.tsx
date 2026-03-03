import { useState } from 'react';
import type React from 'react';
import { Package, Route, Clock, MapPin, Copy, Check } from 'lucide-react';
import type { MapConvoy } from '@/api/map';
import { latLonToMGRS } from '@/utils/coordinates';
import { formatRelativeTime } from '@/lib/utils';

interface ConvoyDetailPanelProps {
  data: MapConvoy;
}

type Tab = 'cargo' | 'route' | 'timeline';

function getConvoyStatusColor(status: string): string {
  switch (status) {
    case 'EN_ROUTE':
      return '#4ade80';
    case 'DELAYED':
      return '#fbbf24';
    case 'PLANNED':
      return '#94a3b8';
    case 'COMPLETE':
      return '#60a5fa';
    case 'CANCELLED':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

function getConvoyStatusLabel(status: string): string {
  switch (status) {
    case 'EN_ROUTE':
      return 'EN ROUTE';
    default:
      return status;
  }
}

export function ConvoyDetailPanel({ data }: ConvoyDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cargo');
  const [copied, setCopied] = useState<string | null>(null);

  const originMGRS = latLonToMGRS(data.origin.lat, data.origin.lon);
  const destMGRS = latLonToMGRS(data.destination.lat, data.destination.lon);
  const currentMGRS = data.current_position
    ? latLonToMGRS(data.current_position.lat, data.current_position.lon)
    : null;

  const handleCopy = (label: string, lat: number, lon: number, mgrsVal: string) => {
    const text = `${lat.toFixed(6)}, ${lon.toFixed(6)} | MGRS: ${mgrsVal}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const formatGPS = (lat: number, lon: number): string => {
    return `${Math.abs(lat).toFixed(6)}${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(6)}${lon >= 0 ? 'E' : 'W'}`;
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'cargo', label: 'Cargo', icon: <Package size={12} /> },
    { key: 'route', label: 'Route', icon: <Route size={12} /> },
    { key: 'timeline', label: 'Timeline', icon: <Clock size={12} /> },
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

      {/* Cargo Tab */}
      {activeTab === 'cargo' && (
        <div style={styles.tabContent}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>CONVOY DETAILS</div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Status</span>
              <span
                style={{
                  ...styles.statusPill,
                  backgroundColor: getConvoyStatusColor(data.status),
                }}
              >
                {getConvoyStatusLabel(data.status)}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Vehicles</span>
              <span style={styles.detailValue}>{data.vehicle_count}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Cargo</span>
              <span style={styles.detailValue}>{data.cargo_summary}</span>
            </div>
          </div>

          {/* Route summary */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>ROUTE</div>
            <div style={styles.routeVisual}>
              <div style={styles.routePoint}>
                <span style={{ color: '#4ade80', fontSize: 12 }}>{'\u25CF'}</span>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 9 }}>ORIGIN</div>
                  <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                    {data.origin.name}
                  </div>
                </div>
              </div>
              <div style={styles.routeLine} />
              <div style={styles.routePoint}>
                <span style={{ color: '#60a5fa', fontSize: 12 }}>{'\u25CF'}</span>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 9 }}>DESTINATION</div>
                  <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                    {data.destination.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Tab */}
      {activeTab === 'route' && (
        <div style={styles.tabContent}>
          {/* Origin */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MapPin size={11} style={{ marginRight: 4 }} />
              ORIGIN
            </div>
            <div style={styles.locationName}>{data.origin.name}</div>
            <div style={styles.coordBlock}>
              <div style={styles.coordRow}>
                <span style={styles.coordLabel}>GPS</span>
                <span style={styles.coordValue}>
                  {formatGPS(data.origin.lat, data.origin.lon)}
                </span>
              </div>
              <div style={styles.coordRow}>
                <span style={styles.coordLabel}>MGRS</span>
                <span style={styles.coordValue}>{originMGRS}</span>
              </div>
            </div>
            <button
              onClick={() => handleCopy('origin', data.origin.lat, data.origin.lon, originMGRS)}
              style={styles.copyBtn}
            >
              {copied === 'origin' ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied === 'origin' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Destination */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MapPin size={11} style={{ marginRight: 4 }} />
              DESTINATION
            </div>
            <div style={styles.locationName}>{data.destination.name}</div>
            <div style={styles.coordBlock}>
              <div style={styles.coordRow}>
                <span style={styles.coordLabel}>GPS</span>
                <span style={styles.coordValue}>
                  {formatGPS(data.destination.lat, data.destination.lon)}
                </span>
              </div>
              <div style={styles.coordRow}>
                <span style={styles.coordLabel}>MGRS</span>
                <span style={styles.coordValue}>{destMGRS}</span>
              </div>
            </div>
            <button
              onClick={() => handleCopy('dest', data.destination.lat, data.destination.lon, destMGRS)}
              style={styles.copyBtn}
            >
              {copied === 'dest' ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied === 'dest' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Current Position */}
          {data.current_position && currentMGRS && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <MapPin size={11} style={{ marginRight: 4 }} />
                CURRENT POSITION
              </div>
              <div style={styles.coordBlock}>
                <div style={styles.coordRow}>
                  <span style={styles.coordLabel}>GPS</span>
                  <span style={styles.coordValue}>
                    {formatGPS(data.current_position.lat, data.current_position.lon)}
                  </span>
                </div>
                <div style={styles.coordRow}>
                  <span style={styles.coordLabel}>MGRS</span>
                  <span style={styles.coordValue}>{currentMGRS}</span>
                </div>
              </div>
              <button
                onClick={() =>
                  handleCopy('current', data.current_position!.lat, data.current_position!.lon, currentMGRS!)
                }
                style={styles.copyBtn}
              >
                {copied === 'current' ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied === 'current' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Movement Details */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>MOVEMENT</div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Status</span>
              <span
                style={{
                  ...styles.statusPill,
                  backgroundColor: getConvoyStatusColor(data.status),
                }}
              >
                {getConvoyStatusLabel(data.status)}
              </span>
            </div>
            {data.speed_kph > 0 && (
              <>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Speed</span>
                  <span style={styles.detailValue}>{data.speed_kph} KPH</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Heading</span>
                  <span style={styles.detailValue}>{data.heading}{'\u00B0'}</span>
                </div>
              </>
            )}
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>ETA</span>
              <span style={styles.detailValue}>{formatRelativeTime(data.eta)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div style={styles.tabContent}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Clock size={11} style={{ marginRight: 4 }} />
              TIMELINE
            </div>
            <div style={styles.timelineItem}>
              <div style={timelineDot('#4ade80')} />
              <div style={styles.timelineContent}>
                <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                  Departure
                </div>
                <div style={styles.mutedText}>
                  {formatRelativeTime(data.departure_time)}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 2 }}>
                  From {data.origin.name}
                </div>
              </div>
            </div>
            <div style={styles.timelineConnector} />
            {data.current_position && (
              <>
                <div style={styles.timelineItem}>
                  <div style={timelineDot('#fbbf24')} />
                  <div style={styles.timelineContent}>
                    <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                      In Transit
                    </div>
                    <div style={styles.mutedText}>
                      {data.speed_kph > 0 ? `Moving at ${data.speed_kph} KPH` : 'Stationary'}
                    </div>
                  </div>
                </div>
                <div style={styles.timelineConnector} />
              </>
            )}
            <div style={styles.timelineItem}>
              <div style={timelineDot('#60a5fa')} />
              <div style={styles.timelineContent}>
                <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>
                  Estimated Arrival
                </div>
                <div style={styles.mutedText}>{formatRelativeTime(data.eta)}</div>
                <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 2 }}>
                  At {data.destination.name}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>STATUS</div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Current</span>
              <span
                style={{
                  ...styles.statusPill,
                  backgroundColor: getConvoyStatusColor(data.status),
                }}
              >
                {getConvoyStatusLabel(data.status)}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Vehicles</span>
              <span style={styles.detailValue}>{data.vehicle_count}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Cargo</span>
              <span style={styles.detailValue}>{data.cargo_summary}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timelineDot(color: string): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 3,
    backgroundColor: color,
  };
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
  mutedText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  locationName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 6,
  },
  coordBlock: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    padding: '6px 10px',
    marginBottom: 6,
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
    gap: 4,
    padding: '4px 8px',
    fontSize: 9,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#60a5fa',
    backgroundColor: 'rgba(96,165,250,0.1)',
    border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 4,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
  },
  routeVisual: {
    padding: '8px 0 8px 8px',
  },
  routePoint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  routeLine: {
    borderLeft: '1px dashed rgba(255,255,255,0.15)',
    marginLeft: 5,
    height: 16,
  },
  timelineItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineConnector: {
    borderLeft: '1px dashed rgba(255,255,255,0.12)',
    marginLeft: 4,
    height: 16,
  },
};
