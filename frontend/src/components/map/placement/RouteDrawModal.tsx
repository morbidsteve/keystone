import { useState, useCallback, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import * as mapApi from '@/api/map';
import { useQueryClient } from '@tanstack/react-query';

const ROUTE_TYPES = [
  { value: 'MSR', label: 'MSR (Main Supply Route)' },
  { value: 'ASR', label: 'ASR (Alternate Supply Route)' },
  { value: 'SUPPLY_ROUTE', label: 'Supply Route' },
  { value: 'CONVOY_ROUTE', label: 'Convoy Route' },
  { value: 'AIR_CORRIDOR', label: 'Air Corridor' },
];

const ROUTE_STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'RESTRICTED', label: 'Restricted' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function RouteDrawModal() {
  const routeDrawing = useMapStore((s) => s.routeDrawing);
  const clearRouteDrawing = useMapStore((s) => s.clearRouteDrawing);
  const setAddingWaypoint = useMapStore((s) => s.setAddingWaypoint);
  const removeRouteWaypoint = useMapStore((s) => s.removeRouteWaypoint);
  const reorderRouteWaypoint = useMapStore((s) => s.reorderRouteWaypoint);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [routeType, setRouteType] = useState('MSR');
  const [status, setStatus] = useState('OPEN');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Track waypoint labels locally
  const [waypointLabels, setWaypointLabels] = useState<Record<number, string>>({});

  // Reset form when opening — pre-populate when editing
  useEffect(() => {
    if (routeDrawing.active) {
      if (routeDrawing.editingRouteId) {
        // Editing: pre-populate from store metadata
        setName(routeDrawing.editName || '');
        setRouteType(routeDrawing.editRouteType || 'MSR');
        setStatus(routeDrawing.editStatus || 'OPEN');
        setDescription(routeDrawing.editDescription || '');
      } else {
        // Creating new: blank form
        setName('');
        setRouteType('MSR');
        setStatus('OPEN');
        setDescription('');
      }
      setError('');
      setWaypointLabels({});
    }
  }, [routeDrawing.active]);

  const handleAddWaypoint = useCallback(() => {
    setAddingWaypoint(true);
  }, [setAddingWaypoint]);

  const handleMoveWaypoint = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= routeDrawing.waypoints.length) return;

      // Also reorder labels
      setWaypointLabels((prev) => {
        const next = { ...prev };
        const fromLabel = next[fromIndex];
        const toLabel = next[toIndex];
        if (fromLabel !== undefined) next[toIndex] = fromLabel;
        else delete next[toIndex];
        if (toLabel !== undefined) next[fromIndex] = toLabel;
        else delete next[fromIndex];
        return next;
      });

      reorderRouteWaypoint(fromIndex, toIndex);
    },
    [routeDrawing.waypoints.length, reorderRouteWaypoint],
  );

  const handleDeleteWaypoint = useCallback(
    (index: number) => {
      // Shift labels down
      setWaypointLabels((prev) => {
        const next: Record<number, string> = {};
        for (const [key, val] of Object.entries(prev)) {
          const k = parseInt(key);
          if (k < index) next[k] = val;
          else if (k > index) next[k - 1] = val;
          // skip the deleted index
        }
        return next;
      });
      removeRouteWaypoint(index);
    },
    [removeRouteWaypoint],
  );

  const handleLabelChange = useCallback((index: number, label: string) => {
    setWaypointLabels((prev) => ({ ...prev, [index]: label }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter a route name.');
      return;
    }
    if (routeDrawing.waypoints.length < 2) {
      setError('A route needs at least 2 waypoints.');
      return;
    }

    setIsSubmitting(true);

    try {
      const waypoints = routeDrawing.waypoints.map((wp, idx) => ({
        lat: wp.lat,
        lon: wp.lon,
        label: waypointLabels[idx] || wp.label,
      }));

      if (routeDrawing.editingRouteId) {
        await mapApi.updateRoute(routeDrawing.editingRouteId, {
          name: name.trim(),
          route_type: routeType,
          status,
          description: description.trim(),
          waypoints,
        });
      } else {
        await mapApi.createRoute({
          name: name.trim(),
          route_type: routeType,
          status,
          description: description.trim(),
          waypoints,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['map', 'data'] });
      clearRouteDrawing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    routeType,
    status,
    description,
    routeDrawing.waypoints,
    routeDrawing.editingRouteId,
    waypointLabels,
    clearRouteDrawing,
    queryClient,
  ]);

  if (!routeDrawing.active) return null;

  // When adding a waypoint, collapse to a compact floating bar so the map is clickable
  if (routeDrawing.addingWaypoint) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 20px',
          backgroundColor: 'rgba(26, 31, 46, 0.95)',
          border: '1px solid rgba(96, 165, 250, 0.4)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#60a5fa',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600, letterSpacing: '1px' }}>
          CLICK MAP TO ADD WAYPOINT
        </span>
        <span style={{ color: '#64748b', fontSize: 10 }}>
          ({routeDrawing.waypoints.length} placed)
        </span>
        <button
          onClick={() => setAddingWaypoint(false)}
          style={{
            padding: '4px 12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
          }}
        >
          DONE
        </button>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: '#0f1219',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    paddingRight: 28,
  };

  const smallBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  };

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
        if (e.target === e.currentTarget) clearRouteDrawing();
      }}
    >
      <div
        style={{
          width: 480,
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
            }}
          >
            {routeDrawing.editingRouteId ? 'EDIT ROUTE' : 'DRAW ROUTE'}
          </span>
          <button
            onClick={clearRouteDrawing}
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
          {/* Name */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>ROUTE NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MSR TAMPA"
              style={inputStyle}
            />
          </div>

          {/* Route Type */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>ROUTE TYPE</label>
            <select
              value={routeType}
              onChange={(e) => setRouteType(e.target.value)}
              style={selectStyle}
            >
              {ROUTE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>STATUS</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={selectStyle}
            >
              {ROUTE_STATUSES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Route description..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 60,
              }}
            />
          </div>

          {/* Waypoints */}
          <div
            style={{
              padding: '12px 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span style={labelStyle}>WAYPOINTS ({routeDrawing.waypoints.length})</span>
              <button
                onClick={handleAddWaypoint}
                disabled={routeDrawing.addingWaypoint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  borderRadius: 4,
                  backgroundColor: routeDrawing.addingWaypoint
                    ? 'rgba(96, 165, 250, 0.2)'
                    : 'transparent',
                  color: '#60a5fa',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: routeDrawing.addingWaypoint ? 'default' : 'pointer',
                }}
              >
                <Plus size={12} />
                {routeDrawing.addingWaypoint ? 'CLICK MAP...' : 'ADD WAYPOINT'}
              </button>
            </div>

            {routeDrawing.waypoints.length === 0 && (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: 10,
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                }}
              >
                No waypoints yet. Click "Add Waypoint" then click on the map.
              </div>
            )}

            {routeDrawing.waypoints.map((wp, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === routeDrawing.waypoints.length - 1;
              const dotColor = isFirst ? '#4ade80' : isLast ? '#f87171' : '#60a5fa';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 4,
                    marginBottom: 4,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      flexShrink: 0,
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#e2e8f0',
                          flexShrink: 0,
                        }}
                      >
                        WP {idx + 1}
                        {isFirst ? ' (START)' : isLast && routeDrawing.waypoints.length > 1 ? ' (END)' : ''}
                      </span>
                      <input
                        type="text"
                        value={waypointLabels[idx] ?? wp.label ?? ''}
                        onChange={(e) => handleLabelChange(idx, e.target.value)}
                        placeholder="Label..."
                        style={{
                          flex: 1,
                          padding: '2px 4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 2,
                          color: '#e2e8f0',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          outline: 'none',
                          minWidth: 0,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: '#64748b',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {wp.lat.toFixed(6)}, {wp.lon.toFixed(6)}
                    </div>
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => handleMoveWaypoint(idx, 'up')}
                      disabled={isFirst}
                      style={{
                        ...smallBtnStyle,
                        opacity: isFirst ? 0.3 : 1,
                        cursor: isFirst ? 'default' : 'pointer',
                      }}
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveWaypoint(idx, 'down')}
                      disabled={isLast}
                      style={{
                        ...smallBtnStyle,
                        opacity: isLast ? 0.3 : 1,
                        cursor: isLast ? 'default' : 'pointer',
                      }}
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteWaypoint(idx)}
                      style={{
                        ...smallBtnStyle,
                        color: '#f87171',
                        borderColor: 'rgba(248, 113, 113, 0.3)',
                      }}
                      title="Delete waypoint"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: 4,
                color: '#f87171',
                fontSize: 10,
                marginBottom: 12,
              }}
            >
              {error}
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
              onClick={clearRouteDrawing}
              disabled={isSubmitting}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
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
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting
                ? 'SAVING...'
                : routeDrawing.editingRouteId
                  ? 'UPDATE ROUTE'
                  : 'CREATE ROUTE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
