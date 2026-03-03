import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import type { PlacementType } from '@/stores/mapStore';
import CoordinateInput from './CoordinateInput';
import * as mapApi from '@/api/map';

const MOCK_UNITS = [
  { id: '1mef', name: 'I MEF', abbreviation: 'I MEF' },
  { id: '1mardiv', name: '1st Marine Division', abbreviation: '1 MARDIV' },
  { id: '1mar', name: '1st Marine Regiment', abbreviation: '1 MAR' },
  { id: '1-1', name: '1st Battalion, 1st Marines', abbreviation: '1/1' },
  { id: '2-1', name: '2nd Battalion, 1st Marines', abbreviation: '2/1' },
];

const SUPPLY_POINT_TYPES = [
  { value: 'LOG_BASE', label: 'Logistics Base' },
  { value: 'SUPPLY_POINT', label: 'Supply Point' },
  { value: 'AMMO_SUPPLY_POINT', label: 'Ammo Supply Point' },
  { value: 'WATER_POINT', label: 'Water Point' },
  { value: 'FARP', label: 'FARP' },
  { value: 'LZ', label: 'Landing Zone' },
  { value: 'MAINTENANCE_COLLECTION_POINT', label: 'Maintenance Collection Point' },
  { value: 'BEACH', label: 'Beach' },
  { value: 'PORT', label: 'Port' },
];

const LZ_FARP_TYPES = [
  { value: 'LZ', label: 'Landing Zone' },
  { value: 'FARP', label: 'FARP' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'INACTIVE', label: 'Inactive' },
];

function getModalTitle(type: PlacementType | null): string {
  switch (type) {
    case 'unit':
      return 'PLACE UNIT';
    case 'supply_point':
      return 'ADD SUPPLY POINT';
    case 'maintenance_site':
      return 'ADD MAINTENANCE SITE';
    case 'lz_farp':
      return 'ADD LZ / FARP';
    default:
      return 'PLACE ENTITY';
  }
}

export default function PlaceEntityModal() {
  const placement = useMapStore((s) => s.placement);
  const clearPlacement = useMapStore((s) => s.clearPlacement);

  const [lat, setLat] = useState(placement.lat);
  const [lon, setLon] = useState(placement.lon);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [name, setName] = useState('');
  const [pointType, setPointType] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [parentUnit, setParentUnit] = useState('');
  const [capacityNotes, setCapacityNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state when placement changes
  const prevPlacementRef = useState(placement)[0];
  if (prevPlacementRef !== placement && placement.active) {
    // This is intentionally in render to sync with store changes
    // We set state here so the next render picks up the correct coords
  }

  const handleCoordChange = useCallback((newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError('');
    setIsSubmitting(true);

    try {
      if (placement.type === 'unit') {
        if (!selectedUnit) {
          setError('Please select a unit.');
          setIsSubmitting(false);
          return;
        }
        await mapApi.updateUnitPosition(selectedUnit, {
          latitude: lat,
          longitude: lon,
        });
      } else {
        if (!name.trim()) {
          setError('Please enter a name.');
          setIsSubmitting(false);
          return;
        }

        let resolvedType = pointType;
        if (placement.type === 'maintenance_site') {
          resolvedType = 'MAINTENANCE_COLLECTION_POINT';
        }
        if (!resolvedType && placement.type === 'supply_point') {
          setError('Please select a type.');
          setIsSubmitting(false);
          return;
        }
        if (!resolvedType && placement.type === 'lz_farp') {
          setError('Please select a type.');
          setIsSubmitting(false);
          return;
        }

        await mapApi.createSupplyPoint({
          name: name.trim(),
          point_type: resolvedType,
          latitude: lat,
          longitude: lon,
          status,
          parent_unit_name: parentUnit,
          capacity_notes: capacityNotes,
        });
      }

      clearPlacement();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place entity');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    placement.type,
    selectedUnit,
    lat,
    lon,
    name,
    pointType,
    status,
    parentUnit,
    capacityNotes,
    clearPlacement,
  ]);

  if (!placement.active) return null;

  // Initialize coordinates from placement if they differ
  if (lat === 0 && lon === 0 && placement.lat !== 0) {
    setLat(placement.lat);
    setLon(placement.lon);
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

  const typeOptions =
    placement.type === 'lz_farp'
      ? LZ_FARP_TYPES
      : placement.type === 'maintenance_site'
        ? [{ value: 'MAINTENANCE_COLLECTION_POINT', label: 'Maintenance Collection Point' }]
        : SUPPLY_POINT_TYPES;

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
        if (e.target === e.currentTarget) clearPlacement();
      }}
    >
      <div
        style={{
          width: 400,
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
            {getModalTitle(placement.type)}
          </span>
          <button
            onClick={clearPlacement}
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
          {/* Unit placement form */}
          {placement.type === 'unit' && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>SELECT UNIT</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- Select Unit --</option>
                {MOCK_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.abbreviation} - {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supply point / maintenance / LZ-FARP forms */}
          {placement.type !== 'unit' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. LOG BASE DELTA"
                  style={inputStyle}
                />
              </div>

              {placement.type !== 'maintenance_site' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>TYPE</label>
                  <select
                    value={pointType}
                    onChange={(e) => setPointType(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">-- Select Type --</option>
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={selectStyle}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>PARENT UNIT</label>
                <select
                  value={parentUnit}
                  onChange={(e) => setParentUnit(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">-- Select Unit --</option>
                  {MOCK_UNITS.map((u) => (
                    <option key={u.id} value={u.abbreviation}>
                      {u.abbreviation} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>CAPACITY NOTES</label>
                <textarea
                  value={capacityNotes}
                  onChange={(e) => setCapacityNotes(e.target.value)}
                  placeholder="e.g. Full capacity, 3-day surge stock"
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 60,
                  }}
                />
              </div>
            </>
          )}

          {/* Coordinate input (all types) */}
          <div
            style={{
              padding: '12px 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                ...labelStyle,
                marginBottom: 8,
              }}
            >
              COORDINATES
            </div>
            <CoordinateInput
              latitude={lat}
              longitude={lon}
              onChange={handleCoordChange}
            />
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
              onClick={clearPlacement}
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
              {isSubmitting ? 'PLACING...' : placement.type === 'unit' ? 'UPDATE POSITION' : 'CREATE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
