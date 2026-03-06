import { useEffect } from 'react';
import { X, MapPin, Clock, ArrowRight, Truck, Package, Users, AlertTriangle, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MovementStatus, type Movement, type SupplyClass } from '@/lib/types';
import { formatDate, formatDateShort } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MovementDetailModalProps {
  movement: Movement | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Supply class name helper
// ---------------------------------------------------------------------------

const SUPPLY_CLASS_NAMES: Record<string, string> = {
  'I': 'Subsistence',
  'II': 'Clothing & Equipment',
  'III': 'POL',
  'IIIA': 'Aviation Fuel',
  'IV': 'Construction',
  'V': 'Ammunition',
  'VI': 'Personal Demand',
  'VII': 'Major End Items',
  'VIII': 'Medical',
  'IX': 'Repair Parts',
  'X': 'Non-Military',
};

function supplyClassLabel(sc: SupplyClass | string): string {
  const name = SUPPLY_CLASS_NAMES[sc];
  return name ? `CL ${sc} — ${name}` : `CL ${sc}`;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: MovementStatus): string {
  switch (status) {
    case MovementStatus.EN_ROUTE: return 'var(--color-accent)';
    case MovementStatus.ARRIVED: return 'var(--color-success)';
    case MovementStatus.DELAYED: return 'var(--color-danger)';
    case MovementStatus.PLANNED: return 'var(--color-accent)';
    case MovementStatus.CANCELLED: return 'var(--color-text-muted)';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'var(--color-danger)';
    case 'PRIORITY': return 'var(--color-warning)';
    default: return 'var(--color-text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Shared style helpers (matching WorkOrderDetailModal patterns)
// ---------------------------------------------------------------------------

const badgeStyle = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '2px 8px',
  borderRadius: 2,
  border: `1px solid ${color}`,
  color,
  backgroundColor: `${color}15`,
  whiteSpace: 'nowrap',
});

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  paddingBottom: 8,
  marginBottom: 12,
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const infoLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: 2,
};

const infoValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--color-text-bright)',
  fontWeight: 500,
};

const thStyle = (align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  padding: '6px 10px',
  textAlign: align,
  borderBottom: '1px solid var(--color-border)',
  letterSpacing: '1px',
});

const tdStyle = (align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  padding: '6px 10px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  textAlign: align,
});

// ---------------------------------------------------------------------------
// Mini-map auto-fit component
// ---------------------------------------------------------------------------

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

// ---------------------------------------------------------------------------
// Marker icon helpers
// ---------------------------------------------------------------------------

function createCircleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);"></div>`,
  });
}

// ---------------------------------------------------------------------------
// Duration helper
// ---------------------------------------------------------------------------

function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (isNaN(ms) || ms < 0) return '—';
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TILE_URL =
  import.meta.env.VITE_TILE_SERVER_URL ||
  '/tiles/osm/{z}/{x}/{y}.png';

export default function MovementDetailModal({ movement, onClose }: MovementDetailModalProps) {
  useEffect(() => {
    if (!movement) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [movement, onClose]);

  if (!movement) return null;

  const mov = movement;
  const statusColor = getStatusColor(mov.status);
  const priorityColor = getPriorityColor(mov.priority);
  const manifest = mov.manifest;

  // Determine origin/destination coords for mini-map
  const originCoord = mov.originCoords ?? (mov.routeWaypoints && mov.routeWaypoints.length > 0 ? mov.routeWaypoints[0] : null);
  const destCoord = mov.destinationCoords ?? (mov.routeWaypoints && mov.routeWaypoints.length > 0 ? mov.routeWaypoints[mov.routeWaypoints.length - 1] : null);
  const hasMapData = originCoord && destCoord;

  const routePositions: [number, number][] = mov.routeWaypoints
    ? mov.routeWaypoints.map((wp) => [wp.lat, wp.lon])
    : hasMapData
      ? [[originCoord.lat, originCoord.lon], [destCoord.lat, destCoord.lon]]
      : [];

  const mapBounds: L.LatLngBoundsExpression | null = routePositions.length >= 2
    ? L.latLngBounds(routePositions.map(([lat, lon]) => L.latLng(lat, lon)))
    : null;

  // Duration calculation
  const endTime = mov.arrivalTime ?? mov.eta;
  const durationStr = mov.departureTime && endTime ? formatDuration(mov.departureTime, endTime) : null;

  return (
    <div
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.85)] inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[90%] max-w-[900px] max-h-[90vh] bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-[var(--radius)] flex flex-col overflow-hidden"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className="flex justify-between items-center py-3.5 px-4 border-b border-b-[var(--color-border)]"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <Truck size={16} style={{ color: statusColor }} />
            <span
              className="font-[var(--font-mono)] text-sm font-bold tracking-[1.5px] text-[var(--color-text-bright)]" style={{ textDecoration: mov.status === MovementStatus.CANCELLED ? 'line-through' : undefined }}
            >
              {mov.name}
            </span>
            <span style={badgeStyle(statusColor)}>
              {mov.status === MovementStatus.EN_ROUTE
                ? 'EN ROUTE'
                : mov.status.replace(/_/g, ' ')}
            </span>
            <span style={badgeStyle(priorityColor)}>
              {mov.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-transparent border-0 text-[var(--color-text-muted)] cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-4 px-5">
          {/* ID + Last Updated */}
          <div className="flex justify-between mb-4">
            <span
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] tracking-[0.5px]"
            >
              ID: {mov.id}
            </span>
            <span
              className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
            >
              Updated: {formatDateShort(mov.lastUpdated)}
            </span>
          </div>

          {/* ── Route Section ─────────────────────────────────────── */}
          <div className="mb-6">
            <div style={sectionHeaderStyle}>
              <MapPin size={12} />
              ROUTE
            </div>

            {/* Origin -> Destination */}
            <div
              className="flex items-center gap-3 mb-3 font-[var(--font-mono)] text-xs"
            >
              <span className="text-[var(--color-success)] font-semibold">{mov.originUnit}</span>
              <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-bright)] font-semibold">{mov.destinationUnit}</span>
            </div>

            {/* Coordinates grid */}
            {hasMapData && (
              <div className="grid gap-3 mb-3 grid-cols-2">
                <div>
                  <div style={infoLabelStyle}>ORIGIN COORDS</div>
                  <div style={infoValueStyle}>
                    {originCoord.lat.toFixed(4)}, {originCoord.lon.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div style={infoLabelStyle}>DESTINATION COORDS</div>
                  <div style={infoValueStyle}>
                    {destCoord.lat.toFixed(4)}, {destCoord.lon.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Mini-map */}
            {hasMapData && mapBounds && (
              <div
                className="h-[200px] rounded-[var(--radius)] overflow-hidden border border-[var(--color-border)] mb-3"
              >
                <MapContainer
                  center={[originCoord.lat, originCoord.lon]}
                  zoom={12}
                  className="h-full w-full"
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url={TILE_URL}
                    maxZoom={19}
                  />
                  <FitBounds bounds={mapBounds} />
                  <Marker
                    position={[originCoord.lat, originCoord.lon]}
                    icon={createCircleIcon('#40c057')}
                  />
                  <Marker
                    position={[destCoord.lat, destCoord.lon]}
                    icon={createCircleIcon('#ff6b6b')}
                  />
                  {routePositions.length >= 2 && (
                    <Polyline
                      positions={routePositions}
                      pathOptions={{ color: '#4dabf7', weight: 3, opacity: 0.8, dashArray: '8 4' }}
                    />
                  )}
                </MapContainer>
              </div>
            )}

            {/* Waypoints table */}
            {mov.routeWaypoints && mov.routeWaypoints.length > 0 && (
              <div className="mb-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th style={thStyle()}>WP #</th>
                      <th style={thStyle('right')}>LAT</th>
                      <th style={thStyle('right')}>LON</th>
                      <th style={thStyle()}>LABEL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mov.routeWaypoints.map((wp, i) => (
                      <tr key={i}>
                        <td style={tdStyle()}>{i + 1}</td>
                        <td style={tdStyle('right')}>{wp.lat.toFixed(4)}</td>
                        <td style={tdStyle('right')}>{wp.lon.toFixed(4)}</td>
                        <td style={tdStyle()}>{wp.label ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Timeline Section ──────────────────────────────────── */}
          <div className="mb-6">
            <div style={sectionHeaderStyle}>
              <Clock size={12} />
              TIMELINE
            </div>
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
              {mov.departureTime && (
                <div>
                  <div style={infoLabelStyle}>DEPARTURE</div>
                  <div style={infoValueStyle}>{formatDate(mov.departureTime)}</div>
                </div>
              )}
              {mov.eta && (
                <div>
                  <div style={infoLabelStyle}>ETA</div>
                  <div style={infoValueStyle}>{formatDate(mov.eta)}</div>
                </div>
              )}
              {mov.arrivalTime && (
                <div>
                  <div style={infoLabelStyle}>ARRIVAL</div>
                  <div style={{ ...infoValueStyle, color: 'var(--color-success)' }}>{formatDate(mov.arrivalTime)}</div>
                </div>
              )}
              {durationStr && (
                <div>
                  <div style={infoLabelStyle}>DURATION</div>
                  <div style={infoValueStyle}>{durationStr}</div>
                </div>
              )}
              <div>
                <div style={infoLabelStyle}>LAST UPDATED</div>
                <div style={infoValueStyle}>{formatDate(mov.lastUpdated)}</div>
              </div>
            </div>
          </div>

          {/* ── Cargo Manifest Section ────────────────────────────── */}
          {manifest && manifest.cargo.length > 0 && (
            <div className="mb-6">
              <div style={sectionHeaderStyle}>
                <Package size={12} />
                CARGO MANIFEST
                <span style={badgeStyle('var(--color-accent)')}>
                  {manifest.totalWeightTons} TONS
                </span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th style={thStyle()}>SUPPLY CLASS</th>
                    <th style={thStyle()}>DESCRIPTION</th>
                    <th style={thStyle('right')}>QTY</th>
                    <th style={thStyle('right')}>UNIT</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.cargo.map((c, i) => (
                    <tr key={i}>
                      <td style={tdStyle()}>{supplyClassLabel(c.supplyClass)}</td>
                      <td style={tdStyle()}>{c.description}</td>
                      <td style={tdStyle('right')}>{c.quantity.toLocaleString()}</td>
                      <td style={tdStyle('right')}>{c.unit}</td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={2}
                      className="text-[var(--color-text-bright)] border-b-0"
                    >
                      TOTAL WEIGHT
                    </td>
                    <td
                      colSpan={2}
                      className="text-[var(--color-text-bright)] border-b-0"
                    >
                      {manifest.totalWeightTons} T
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Vehicle Manifest Section ──────────────────────────── */}
          {manifest && manifest.vehicles.length > 0 && (
            <div className="mb-6">
              <div style={sectionHeaderStyle}>
                <Truck size={12} />
                VEHICLE MANIFEST
                <span style={badgeStyle('var(--color-accent)')}>
                  {manifest.totalVehicles} VEH
                </span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th style={thStyle()}>TYPE</th>
                    <th style={thStyle()}>TAMCN</th>
                    <th style={thStyle('right')}>QTY</th>
                    <th style={thStyle('right')}>AVAIL (ORIGIN)</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.vehicles.map((v, i) => (
                    <tr key={i}>
                      <td style={tdStyle()}>{v.type}</td>
                      <td style={tdStyle()}>{v.tamcn}</td>
                      <td style={tdStyle('right')}>{v.quantity}</td>
                      <td style={tdStyle('right')}>{v.available}</td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={2}
                      className="text-[var(--color-text-bright)] border-b-0"
                    >
                      TOTAL
                    </td>
                    <td
                      colSpan={2}
                      className="text-[var(--color-text-bright)] border-b-0"
                    >
                      {manifest.totalVehicles} VEH
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Personnel Section ─────────────────────────────────── */}
          {manifest && manifest.personnelByRole.length > 0 && (
            <div className="mb-6">
              <div style={sectionHeaderStyle}>
                <Users size={12} />
                PERSONNEL
                <span style={badgeStyle('var(--color-accent)')}>
                  {manifest.totalPersonnel} PAX
                </span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th style={thStyle()}>ROLE</th>
                    <th style={thStyle('right')}>COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.personnelByRole.map((p, i) => (
                    <tr key={i}>
                      <td style={tdStyle()}>{p.role}</td>
                      <td style={tdStyle('right')}>{p.count}</td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      className="text-[var(--color-text-bright)] border-b-0"
                    >
                      TOTAL
                    </td>
                    <td
                      className="text-[var(--color-text-bright)] border-b-0"
                    >
                      {manifest.totalPersonnel} PAX
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Convoy Manifest Section ───────────────────────────── */}
          {manifest?.convoyManifest && manifest.convoyManifest.vehicles.length > 0 && (
            <div className="mb-6">
              <div style={sectionHeaderStyle}>
                <Truck size={12} />
                CONVOY MANIFEST — VEHICLE ASSIGNMENTS
              </div>
              {manifest.convoyManifest.vehicles.map((cv) => (
                <div
                  key={cv.id}
                  className="mb-3 p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)]"
                >
                  {/* Vehicle card header */}
                  <div
                    className="flex flex-wrap gap-2 items-center mb-2"
                  >
                    {cv.callSign && (
                      <span
                        className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)]"
                      >
                        {cv.callSign}
                      </span>
                    )}
                    <span style={badgeStyle('var(--color-text-muted)')}>
                      {cv.vehicleType}
                    </span>
                    {cv.tamcn && (
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                      >
                        TAMCN: {cv.tamcn}
                      </span>
                    )}
                    {cv.bumperNumber && (
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                      >
                        BN: {cv.bumperNumber}
                      </span>
                    )}
                    {cv.sequenceNumber != null && (
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                      >
                        SEQ: {cv.sequenceNumber}
                      </span>
                    )}
                  </div>

                  {/* Assigned personnel table */}
                  {cv.assignedPersonnel.length > 0 && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th style={thStyle()}>NAME</th>
                          <th style={thStyle()}>ROLE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cv.assignedPersonnel.map((ap) => (
                          <tr key={ap.id}>
                            <td style={tdStyle()}>
                              {ap.personnel.rank ? `${ap.personnel.rank} ` : ''}
                              {ap.personnel.lastName}, {ap.personnel.firstName}
                            </td>
                            <td style={tdStyle()}>{ap.role.replace(/_/g, ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {cv.assignedPersonnel.length === 0 && (
                    <div
                      className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] italic"
                    >
                      No personnel assigned
                    </div>
                  )}
                </div>
              ))}

              {manifest.convoyManifest.unassignedPersonnel.length > 0 && (
                <div
                  className="py-2 px-3 bg-[rgba(250,176,5,0.08)] rounded-[var(--radius)] font-[var(--font-mono)] text-[10px] text-[var(--color-warning)] border border-[rgba(250,176,5,0.2)]"
                >
                  <AlertTriangle size={10} className="mr-1 align-middle" />
                  {manifest.convoyManifest.unassignedPersonnel.length} UNASSIGNED PERSONNEL
                </div>
              )}
            </div>
          )}

          {/* ── Summary row (fallback when no manifest) ───────────── */}
          {!manifest && (
            <div className="mb-6">
              <div style={sectionHeaderStyle}>
                <Package size={12} />
                MOVEMENT SUMMARY
              </div>
              <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                <div>
                  <div style={infoLabelStyle}>CARGO</div>
                  <div style={infoValueStyle}>{mov.cargo || '—'}</div>
                </div>
                <div>
                  <div style={infoLabelStyle}>VEHICLES</div>
                  <div style={infoValueStyle}>{mov.vehicles} VEH</div>
                </div>
                <div>
                  <div style={infoLabelStyle}>PERSONNEL</div>
                  <div style={infoValueStyle}>{mov.personnel} PAX</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Notes Section ─────────────────────────────────────── */}
          {mov.notes && (
            <div className="mb-6">
              <div style={sectionHeaderStyle}>
                <FileText size={12} />
                NOTES
              </div>
              <div
                className="py-2.5 px-3.5 bg-[rgba(250,176,5,0.08)] rounded-[var(--radius)] font-[var(--font-mono)] text-[11px] text-[var(--color-warning)] leading-relaxed border border-[rgba(250,176,5,0.2)]"
              >
                {mov.notes}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div
          className="flex justify-end py-3 px-4 border-t border-t-[var(--color-border)]"
        >
          <button
            onClick={onClose}
            className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] py-1.5 px-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
