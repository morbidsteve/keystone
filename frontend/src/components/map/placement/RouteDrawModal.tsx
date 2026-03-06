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

  useEffect(() => {
    if (!routeDrawing.active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') clearRouteDrawing(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [routeDrawing.active, clearRouteDrawing]);

  if (!routeDrawing.active) return null;

  // When adding a waypoint, collapse to a compact floating bar so the map is clickable
  if (routeDrawing.addingWaypoint) {
    return (
      <div
        className="fixed top-4 z-[3000] flex items-center gap-3 py-2.5 px-5 bg-[rgba(26,31,46,0.95)] rounded-[8px]" style={{ left: '50%', transform: 'translateX(-50%)', border: '1px solid rgba(96, 165, 250, 0.4)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div
          className="w-[8px] h-[8px] bg-[#60a5fa]" style={{ borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }}
        />
        <span className="text-[#e2e8f0] text-[11px] font-semibold tracking-[1px]">
          CLICK MAP TO ADD WAYPOINT
        </span>
        <span className="text-[#64748b] text-[10px]">
          ({routeDrawing.waypoints.length} placed)
        </span>
        <button
          onClick={() => setAddingWaypoint(false)}
          className="py-1 px-3 rounded-[4px] bg-transparent text-[#94a3b8] text-[9px] font-semibold tracking-[0.5px] cursor-pointer" style={{ border: '1px solid rgba(255, 255, 255, 0.2)', fontFamily: "'JetBrains Mono', monospace" }}
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
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.5)] inset-0 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) clearRouteDrawing();
      }}
    >
      <div
        className="w-[480px] max-h-[80vh] overflow-y-auto bg-[#1a1f2e] rounded-[8px]" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 border-b border-b-[rgba(255,255,255,0.1)]"
        >
          <span
            className="text-[11px] font-bold tracking-[2px] text-[#e2e8f0] uppercase"
          >
            {routeDrawing.editingRouteId ? 'EDIT ROUTE' : 'DRAW ROUTE'}
          </span>
          <button
            onClick={clearRouteDrawing}
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
          {/* Name */}
          <div className="mb-3">
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
          <div className="mb-3">
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
          <div className="mb-3">
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
          <div className="mb-3">
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Route description..."
              rows={3}
              className="min-h-[60px]"
            />
          </div>

          {/* Waypoints */}
          <div
            className="py-3 px-0 border-t border-t-[rgba(255,255,255,0.08)]"
          >
            <div
              className="flex items-center justify-between mb-2"
            >
              <span style={labelStyle}>WAYPOINTS ({routeDrawing.waypoints.length})</span>
              <button
                onClick={handleAddWaypoint}
                disabled={routeDrawing.addingWaypoint}
                className="flex items-center gap-1 py-1 px-2.5 rounded-[4px] text-[#60a5fa] text-[9px] font-semibold tracking-[0.5px]" style={{ border: '1px solid rgba(96, 165, 250, 0.4)', backgroundColor: routeDrawing.addingWaypoint
                    ? 'rgba(96, 165, 250, 0.2)'
                    : 'transparent', fontFamily: "'JetBrains Mono', monospace", cursor: routeDrawing.addingWaypoint ? 'default' : 'pointer' }}
              >
                <Plus size={12} />
                {routeDrawing.addingWaypoint ? 'CLICK MAP...' : 'ADD WAYPOINT'}
              </button>
            </div>

            {routeDrawing.waypoints.length === 0 && (
              <div
                className="text-center text-[#64748b] text-[10px] rounded-[4px]" style={{ padding: '16px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}
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
                  className="flex items-center gap-2 py-1.5 px-2 bg-[rgba(255,255,255,0.02)] rounded-[4px] mb-1" style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}
                >
                  {/* Dot */}
                  <div
                    className="w-[8px] h-[8px] shrink-0" style={{ borderRadius: '50%', backgroundColor: dotColor }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="flex items-center gap-1.5 mb-0.5"
                    >
                      <span
                        className="text-[9px] font-bold text-[#e2e8f0] shrink-0"
                      >
                        WP {idx + 1}
                        {isFirst ? ' (START)' : isLast && routeDrawing.waypoints.length > 1 ? ' (END)' : ''}
                      </span>
                      <input
                        type="text"
                        value={waypointLabels[idx] ?? wp.label ?? ''}
                        onChange={(e) => handleLabelChange(idx, e.target.value)}
                        placeholder="Label..."
                        className="flex-1 py-0.5 px-1 bg-[rgba(255,255,255,0.05)] rounded-[2px] text-[#e2e8f0] text-[9px] outline-none min-w-[0px]" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: "'JetBrains Mono', monospace" }}
                      />
                    </div>
                    <div
                      className="text-[9px] text-[#64748b] font-mono"
                    >
                      {wp.lat.toFixed(6)}, {wp.lon.toFixed(6)}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-0.5">
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
              className="py-2 px-2.5 bg-[rgba(248,113,113,0.1)] rounded-[4px] text-[#f87171] text-[10px] mb-3 border border-[rgba(248,113,113,0.3)]"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div
            className="flex gap-2 justify-end pt-2 border-t border-t-[rgba(255,255,255,0.08)]"
          >
            <button
              onClick={clearRouteDrawing}
              disabled={isSubmitting}
              className="py-[7px] px-4 rounded-[4px] bg-transparent text-[#94a3b8] text-[10px] font-semibold tracking-[1px] cursor-pointer" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="py-[7px] px-4 rounded-[4px] bg-[rgba(96,165,250,0.15)] text-[#60a5fa] text-[10px] font-bold tracking-[1px]" style={{ border: '1px solid #60a5fa', fontFamily: "'JetBrains Mono', monospace", cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
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
