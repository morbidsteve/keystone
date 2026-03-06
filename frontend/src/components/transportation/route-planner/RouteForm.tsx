import { ChevronUp, ChevronDown, Trash2, MapPin, Navigation } from 'lucide-react';
import type { MapData } from '@/api/map';
import type { Waypoint } from './types';
import {
  labelStyle,
  inputStyle,
  smallBtnStyle,
  smallActionBtnStyle,
  formatCoord,
} from './types';

// ---------------------------------------------------------------------------
// SectionHeader (reusable across route-planner)
// ---------------------------------------------------------------------------

export function SectionHeader({
  title,
  expanded,
  onToggle,
  count,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <div
      onClick={onToggle}
      className="flex justify-between items-center py-2 px-0 cursor-pointer border-b border-b-[var(--color-border)]"
    >
      <span
        className="font-[var(--font-mono)] text-[10px] font-bold tracking-[1.5px] text-[var(--color-text-muted)]"
      >
        {title}
        {count !== undefined ? ` (${count})` : ''}
      </span>
      {expanded ? (
        <ChevronUp size={14} className="text-[var(--color-text-muted)]" />
      ) : (
        <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RouteFormProps {
  expanded: boolean;
  onToggle: () => void;
  // Route data
  waypoints: Waypoint[];
  origin: string;
  destination: string;
  originCoords: { lat: number; lon: number } | null;
  destinationCoords: { lat: number; lon: number } | null;
  autoRouteName: string | null;
  selectionMode: 'origin' | 'destination' | 'waypoint';
  mapData: MapData | null;
  // Computed
  segmentDistances: number[];
  totalDistance: number;
  estimatedTime: number;
  // Handlers
  onSetSelectionMode: (mode: 'origin' | 'destination' | 'waypoint') => void;
  onSelectOriginUnit: (unitId: string, abbreviation: string, lat: number, lon: number) => void;
  onSelectDestinationUnit: (abbreviation: string, lat: number, lon: number) => void;
  onSetOriginFromDropdown: (name: string, lat: number, lon: number) => void;
  onSetDestinationFromDropdown: (name: string, lat: number, lon: number) => void;
  onAutoRoute: () => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onDeleteWaypoint: (idx: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RouteForm({
  expanded,
  onToggle,
  waypoints,
  origin,
  destination,
  originCoords,
  destinationCoords,
  autoRouteName,
  selectionMode,
  mapData,
  segmentDistances,
  totalDistance,
  estimatedTime,
  onSetSelectionMode,
  onSelectOriginUnit,
  onSelectDestinationUnit,
  onSetOriginFromDropdown,
  onSetDestinationFromDropdown,
  onAutoRoute,
  onMoveUp,
  onMoveDown,
  onDeleteWaypoint,
}: RouteFormProps) {
  return (
    <div>
      <SectionHeader title="ROUTE" expanded={expanded} onToggle={onToggle} count={waypoints.length} />
      {expanded && (
        <div className="pt-2">
          {/* Origin row */}
          <div className="flex gap-1.5 items-center mb-2">
            <div className="flex-1">
              <div style={labelStyle}>ORIGIN</div>
              <div
                className="items-center gap-1.5 min-h-[32px]"
              >
                <span className="flex-1">{origin || '—'}</span>
                {originCoords && (
                  <span className="text-[9px] text-[var(--color-text-muted)]">
                    {formatCoord(originCoords.lat, originCoords.lon)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onSetSelectionMode('origin')}
              className="mt-4" style={{ backgroundColor: selectionMode === 'origin' ? 'var(--color-accent)' : 'var(--color-bg)', color: selectionMode === 'origin' ? '#fff' : 'var(--color-text-muted)' }}
            >
              <MapPin size={12} /> SELECT
            </button>
          </div>
          {/* Origin quick select */}
          <select
            value=""
            onChange={e => {
              const val = e.target.value;
              if (!val || !mapData) return;
              const unit = mapData.units.find(u => u.unit_id === val);
              if (unit) {
                onSelectOriginUnit(unit.unit_id, unit.abbreviation, unit.latitude, unit.longitude);
                return;
              }
              const sp = mapData.supplyPoints.find(s => s.id === val);
              if (sp) {
                onSetOriginFromDropdown(sp.name, sp.latitude, sp.longitude);
              }
            }}
            style={{ ...inputStyle, marginBottom: 8 }}
          >
            <option value="">-- Quick select origin --</option>
            <optgroup label="UNITS">
              {mapData?.units.map(u => (
                <option key={u.unit_id} value={u.unit_id}>
                  {u.abbreviation}
                </option>
              ))}
            </optgroup>
            <optgroup label="SUPPLY POINTS">
              {mapData?.supplyPoints.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Destination row */}
          <div className="flex gap-1.5 items-center mb-2">
            <div className="flex-1">
              <div style={labelStyle}>DESTINATION</div>
              <div
                className="items-center gap-1.5 min-h-[32px]"
              >
                <span className="flex-1">{destination || '—'}</span>
                {destinationCoords && (
                  <span className="text-[9px] text-[var(--color-text-muted)]">
                    {formatCoord(destinationCoords.lat, destinationCoords.lon)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onSetSelectionMode('destination')}
              className="mt-4" style={{ backgroundColor: selectionMode === 'destination' ? 'var(--color-accent)' : 'var(--color-bg)', color: selectionMode === 'destination' ? '#fff' : 'var(--color-text-muted)' }}
            >
              <MapPin size={12} /> SELECT
            </button>
          </div>
          {/* Destination quick select */}
          <select
            value=""
            onChange={e => {
              const val = e.target.value;
              if (!val || !mapData) return;
              const unit = mapData.units.find(u => u.unit_id === val);
              if (unit) {
                onSelectDestinationUnit(unit.abbreviation, unit.latitude, unit.longitude);
                return;
              }
              const sp = mapData.supplyPoints.find(s => s.id === val);
              if (sp) {
                onSetDestinationFromDropdown(sp.name, sp.latitude, sp.longitude);
              }
            }}
            style={{ ...inputStyle, marginBottom: 8 }}
          >
            <option value="">-- Quick select destination --</option>
            <optgroup label="UNITS">
              {mapData?.units.map(u => (
                <option key={u.unit_id} value={u.unit_id}>
                  {u.abbreviation}
                </option>
              ))}
            </optgroup>
            <optgroup label="SUPPLY POINTS">
              {mapData?.supplyPoints.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Auto-route button */}
          <button
            onClick={onAutoRoute}
            disabled={!originCoords || !destinationCoords}
            className="w-full py-2 px-3 font-[var(--font-mono)] text-[10px] font-bold tracking-[1px] bg-[var(--color-bg)] rounded-[var(--radius)] flex items-center justify-center gap-1.5 mb-2" style={{ color: originCoords && destinationCoords
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)', border: `1px solid ${
                originCoords && destinationCoords
                  ? 'var(--color-accent)'
                  : 'var(--color-border)'
              }`, cursor: originCoords && destinationCoords ? 'pointer' : 'not-allowed', opacity: originCoords && destinationCoords ? 1 : 0.5 }}
          >
            <Navigation size={12} /> AUTO-ROUTE VIA MSR/ASR
          </button>
          {autoRouteName && (
            <div
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-accent)] mb-2"
            >
              Route via: {autoRouteName}
            </div>
          )}

          {/* Waypoint list */}
          <div style={{ ...labelStyle, marginBottom: 6 }}>WAYPOINTS ({waypoints.length})</div>
          {waypoints.length === 0 && (
            <div
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2 px-0"
            >
              Click the map to place waypoints.
            </div>
          )}
          <div className="flex flex-col gap-1 mb-2">
            {waypoints.map((wp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 py-1 px-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[var(--color-text)]"
              >
                <span className="font-bold text-[var(--color-accent)] min-w-[16px]">
                  {idx + 1}
                </span>
                <span className="flex-1 text-[var(--color-text-muted)]">
                  {wp.label || formatCoord(wp.lat, wp.lon)}
                </span>
                {idx < segmentDistances.length && (
                  <span className="text-[var(--color-text-muted)] text-[9px]">
                    {segmentDistances[idx].toFixed(1)}km
                  </span>
                )}
                <button
                  onClick={() => onMoveUp(idx)}
                  disabled={idx === 0}
                  style={{ ...smallBtnStyle, opacity: idx === 0 ? 0.3 : 1 }}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => onMoveDown(idx)}
                  disabled={idx === waypoints.length - 1}
                  style={{
                    ...smallBtnStyle,
                    opacity: idx === waypoints.length - 1 ? 0.3 : 1,
                  }}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  onClick={() => onDeleteWaypoint(idx)}
                  style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}
                  title="Delete waypoint"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          {/* Route summary */}
          {waypoints.length >= 2 && (
            <div
              className="py-2.5 px-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
            >
              <div style={{ ...labelStyle, marginBottom: 6 }}>ROUTE SUMMARY</div>
              <div
                className="flex justify-between font-[var(--font-mono)] text-[11px] text-[var(--color-text)] mb-1"
              >
                <span>TOTAL DISTANCE</span>
                <span className="text-[var(--color-text-bright)] font-bold">
                  {totalDistance.toFixed(1)} km
                </span>
              </div>
              <div
                className="flex justify-between font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
              >
                <span>EST. TRAVEL TIME</span>
                <span className="text-[var(--color-text-bright)] font-bold">
                  {estimatedTime < 1
                    ? `${Math.round(estimatedTime * 60)} min`
                    : `${Math.floor(estimatedTime)}h ${Math.round((estimatedTime % 1) * 60)}m`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
