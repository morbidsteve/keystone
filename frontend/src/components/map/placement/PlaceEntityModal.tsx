import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import type { PlacementType } from '@/stores/mapStore';
import CoordinateInput from './CoordinateInput';
import * as mapApi from '@/api/map';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

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

  // Reset all form state when a new placement starts
  useEffect(() => {
    if (placement.active) {
      setLat(placement.lat);
      setLon(placement.lon);
      setSelectedUnit('');
      setName('');
      setPointType('');
      setStatus('PLANNED');
      setParentUnit('');
      setCapacityNotes('');
      setError('');
    }
  }, [placement.active, placement.lat, placement.lon]);

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

      queryClient.invalidateQueries({ queryKey: ['map', 'data'] });
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
    queryClient,
  ]);

  useEffect(() => {
    if (!placement.active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') clearPlacement(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [placement.active, clearPlacement]);

  if (!placement.active) return null;

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
      className="fixed z-[3000] flex items-center justify-center bg-[rgba(0,0,0,0.5)] inset-0 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) clearPlacement();
      }}
    >
      <div
        className="w-[400px] max-h-[80vh] overflow-y-auto bg-[#1a1f2e] rounded-[8px]" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between py-3 px-4 border-b border-b-[rgba(255,255,255,0.1)]"
        >
          <span
            className="text-[11px] font-bold tracking-[2px] text-[#e2e8f0] uppercase"
          >
            {getModalTitle(placement.type)}
          </span>
          <button
            onClick={clearPlacement}
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
          {/* Unit placement form */}
          {placement.type === 'unit' && (
            <div className="mb-3">
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
              <div className="mb-3">
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
                <div className="mb-3">
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

              <div className="mb-3">
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

              <div className="mb-3">
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

              <div className="mb-3">
                <label style={labelStyle}>CAPACITY NOTES</label>
                <textarea
                  value={capacityNotes}
                  onChange={(e) => setCapacityNotes(e.target.value)}
                  placeholder="e.g. Full capacity, 3-day surge stock"
                  rows={3}
                  className="min-h-[60px]"
                />
              </div>
            </>
          )}

          {/* Coordinate input (all types) */}
          <div
            className="py-3 px-0 border-t border-t-[rgba(255,255,255,0.08)]"
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
              onClick={clearPlacement}
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
              {isSubmitting ? 'PLACING...' : placement.type === 'unit' ? 'UPDATE POSITION' : 'CREATE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
