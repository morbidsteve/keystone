import { useState, useCallback } from 'react';
import type React from 'react';
import { Route, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { MapRoute } from '@/api/map';
import { deleteRoute, updateRoute } from '@/api/map';
import { latLonToMGRS } from '@/utils/coordinates';
import { useMapStore } from '@/stores/mapStore';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { Role } from '@/lib/types';

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

const editRoles: Role[] = [Role.ADMIN, Role.S3, Role.COMMANDER];
const deleteRoles: Role[] = [Role.ADMIN];

export function RouteDetailPanel({ data }: RouteDetailPanelProps) {
  const editRoute = useMapStore((s) => s.editRoute);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const userRole = (user?.role as Role) ?? Role.VIEWER;
  const canEdit = editRoles.includes(userRole);
  const canDelete = deleteRoles.includes(userRole);

  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleEdit = useCallback(() => {
    editRoute(
      data.id,
      data.waypoints.map((wp) => ({
        lat: wp.lat,
        lon: wp.lon,
        label: wp.label,
      })),
      {
        name: data.name,
        routeType: data.route_type,
        status: data.status,
        description: data.description,
      }
    );
    clearSelection();
  }, [data, editRoute, clearSelection]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Delete route "${data.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteRoute(data.id);
      queryClient.invalidateQueries({ queryKey: ['map', 'data'] });
      clearSelection();
    } catch {
      // Silently fail — user can retry
      setIsDeleting(false);
    }
  }, [data.id, data.name, clearSelection, queryClient]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (newStatus === data.status) return;
    setUpdatingStatus(newStatus);
    try {
      await updateRoute(data.id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['map', 'data'] });
    } catch {
      // Silently fail
    } finally {
      setUpdatingStatus(null);
    }
  }, [data.id, data.status, queryClient]);

  const toolbarBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.15s',
  };

  const statusBtnStyle = (btnStatus: string): React.CSSProperties => ({
    padding: '3px 8px',
    border: `1px solid ${data.status === btnStatus ? getRouteStatusColor(btnStatus) : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: 4,
    backgroundColor: data.status === btnStatus
      ? `${getRouteStatusColor(btnStatus)}22`
      : 'transparent',
    color: data.status === btnStatus
      ? getRouteStatusColor(btnStatus)
      : '#94a3b8',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: '0.5px',
    cursor: updatingStatus ? 'not-allowed' : 'pointer',
    opacity: updatingStatus && updatingStatus !== btnStatus ? 0.5 : 1,
    transition: 'all 0.15s',
  });

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      {canEdit && (
        <div style={styles.toolbar}>
          <button
            onClick={handleEdit}
            style={{ ...toolbarBtnStyle, color: '#60a5fa' }}
            title="Edit route"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Pencil size={13} />
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                ...toolbarBtnStyle,
                color: '#f87171',
                borderColor: 'rgba(248, 113, 113, 0.3)',
                opacity: isDeleting ? 0.5 : 1,
              }}
              title="Delete route"
              onMouseEnter={(e) => {
                if (!isDeleting) e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <div className="flex-1" />
          <div className="flex gap-1">
            {(['OPEN', 'RESTRICTED', 'CLOSED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={!!updatingStatus}
                style={statusBtnStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Route size={11} className="mr-1" />
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
            <MapPin size={11} className="mr-1" />
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
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
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
