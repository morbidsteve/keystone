import type React from 'react';
import { Route, MapPin } from 'lucide-react';
import type { MapRoute } from '@/api/map';
import { latLonToMGRS } from '@/utils/coordinates';

interface RouteDetailPanelProps {
  data: MapRoute;
}

function getRouteStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return '#4ade80';
    case 'RESTRICTED':
      return '#fbbf24';
    case 'CLOSED':
      return '#f87171';
    default:
      return '#94a3b8';
  }
}

export function RouteDetailPanel({ data }: RouteDetailPanelProps) {
  return (
    <div style={styles.container}>
      {/* Details */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Route size={11} style={{ marginRight: 4 }} />
          ROUTE DETAILS
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Type</span>
          <span style={styles.detailValue}>{data.route_type}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Status</span>
          <span
            style={{
              ...styles.statusPill,
              backgroundColor: getRouteStatusColor(data.status),
            }}
          >
            {data.status}
          </span>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>DESCRIPTION</div>
          <div style={styles.descriptionBlock}>
            {data.description}
          </div>
        </div>
      )}

      {/* Waypoints */}
      {data.waypoints && data.waypoints.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <MapPin size={11} style={{ marginRight: 4 }} />
            WAYPOINTS ({data.waypoints.length})
          </div>
          <div style={styles.waypointList}>
            {data.waypoints.map((wp, idx) => {
              const mgrsVal = wp.mgrs ?? latLonToMGRS(wp.lat, wp.lon);
              const isFirst = idx === 0;
              const isLast = idx === data.waypoints.length - 1;
              return (
                <div key={idx}>
                  <div style={styles.waypointItem}>
                    <div
                      style={{
                        ...styles.waypointDot,
                        backgroundColor: isFirst
                          ? '#4ade80'
                          : isLast
                            ? '#f87171'
                            : '#60a5fa',
                      }}
                    />
                    <div style={styles.waypointContent}>
                      <div style={styles.waypointIndex}>
                        WP {idx + 1}
                        {isFirst ? ' (START)' : isLast ? ' (END)' : ''}
                        {wp.label ? ` - ${wp.label}` : ''}
                      </div>
                      <div style={styles.waypointCoords}>
                        {wp.lat.toFixed(6)}, {wp.lon.toFixed(6)}
                      </div>
                      <div style={styles.waypointMgrs}>{mgrsVal}</div>
                    </div>
                  </div>
                  {!isLast && <div style={styles.waypointConnector} />}
                </div>
              );
            })}
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
  descriptionBlock: {
    padding: '8px 10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.5,
    borderLeft: '2px solid rgba(96,165,250,0.3)',
  },
  waypointList: {
    padding: '4px 0',
  },
  waypointItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  waypointDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 3,
  },
  waypointContent: {
    flex: 1,
  },
  waypointIndex: {
    fontSize: 10,
    fontWeight: 600,
    color: '#e2e8f0',
    letterSpacing: '0.5px',
  },
  waypointCoords: {
    fontSize: 9,
    color: '#94a3b8',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 1,
  },
  waypointMgrs: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 1,
  },
  waypointConnector: {
    borderLeft: '1px dashed rgba(255,255,255,0.12)',
    marginLeft: 4,
    height: 12,
  },
};
