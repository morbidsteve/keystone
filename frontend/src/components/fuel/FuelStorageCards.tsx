// =============================================================================
// FuelStorageCards — Grid of storage point cards with fill bars
// =============================================================================

import { Droplet } from 'lucide-react';
import type { FuelStoragePoint } from '@/lib/types';

interface FuelStorageCardsProps {
  storagePoints: FuelStoragePoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const facilityTypeLabels: Record<string, string> = {
  FARP: 'FARP',
  FSP: 'Fuel Supply Pt',
  BSA_FUEL_POINT: 'BSA Fuel Pt',
  MOBILE_REFUELER: 'Mobile Refueler',
  BLADDER_FARM: 'Bladder Farm',
  TANK_FARM: 'Tank Farm',
  DISTRIBUTED_CACHE: 'Dist. Cache',
};

function getFillColor(pct: number): string {
  if (pct > 50) return '#22c55e';
  if (pct >= 20) return '#f59e0b';
  return '#ef4444';
}

function getStatusColor(status: string): string {
  if (status === 'OPERATIONAL') return '#22c55e';
  if (status === 'DEGRADED') return '#f59e0b';
  return '#ef4444';
}

function getStatusLabel(status: string): string {
  if (status === 'NON_OPERATIONAL') return 'NON-OP';
  return status;
}

export default function FuelStorageCards({
  storagePoints,
  selectedId,
  onSelect,
}: FuelStorageCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
      }}
    >
      {storagePoints.map((sp) => {
        const isSelected = sp.id === selectedId;
        const fillColor = getFillColor(sp.fill_percentage);
        const statusColor = getStatusColor(sp.status);

        return (
          <div
            key={sp.id}
            onClick={() => onSelect(sp.id)}
            style={{
              padding: 14,
              backgroundColor: 'var(--color-bg-elevated)',
              border: isSelected
                ? '2px solid var(--color-accent)'
                : '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-bright)',
                    marginBottom: 2,
                  }}
                >
                  {sp.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '1px',
                  }}
                >
                  {facilityTypeLabels[sp.facility_type] ?? sp.facility_type}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {/* Fuel type badge */}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                    letterSpacing: '0.5px',
                  }}
                >
                  {sp.fuel_type}
                </span>
                {/* Status badge */}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                    letterSpacing: '0.5px',
                  }}
                >
                  {getStatusLabel(sp.status)}
                </span>
              </div>
            </div>

            {/* Fill bar */}
            <div
              style={{
                width: '100%',
                height: 8,
                backgroundColor: 'var(--color-bg)',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${Math.min(sp.fill_percentage, 100)}%`,
                  height: '100%',
                  backgroundColor: fillColor,
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Droplet size={10} style={{ color: fillColor }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: fillColor,
                  }}
                >
                  {sp.fill_percentage.toFixed(1)}%
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                }}
              >
                {sp.current_gallons.toLocaleString()} / {sp.capacity_gallons.toLocaleString()} gal
              </span>
            </div>

            {/* MGRS location */}
            {sp.mgrs && (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.5px',
                  marginTop: 4,
                }}
              >
                MGRS: {sp.mgrs}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
