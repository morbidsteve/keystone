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
      className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
    >
      {storagePoints.map((sp) => {
        const isSelected = sp.id === selectedId;
        const fillColor = getFillColor(sp.fill_percentage);
        const statusColor = getStatusColor(sp.status);

        return (
          <div
            key={sp.id}
            onClick={() => onSelect(sp.id)}
            className="p-3.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius)] cursor-pointer" style={{ border: isSelected
                ? '2px solid var(--color-accent)'
                : '1px solid var(--color-border)', transition: 'all var(--transition)' }}
          >
            {/* Header row */}
            <div
              className="flex justify-between items-start mb-2.5"
            >
              <div>
                <div
                  className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)] mb-0.5"
                >
                  {sp.name}
                </div>
                <div
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px]"
                >
                  {facilityTypeLabels[sp.facility_type] ?? sp.facility_type}
                </div>
              </div>
              <div
                className="flex gap-1.5 items-center"
              >
                {/* Fuel type badge */}
                <span
                  className="font-[var(--font-mono)] text-[9px] font-semibold py-0.5 px-1.5 rounded-[3px] bg-[rgba(59,130,246,0.15)] text-[#3b82f6] tracking-[0.5px]"
                >
                  {sp.fuel_type}
                </span>
                {/* Status badge */}
                <span
                  className="font-[var(--font-mono)] text-[9px] font-semibold py-0.5 px-1.5 rounded-[3px] tracking-[0.5px]" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                >
                  {getStatusLabel(sp.status)}
                </span>
              </div>
            </div>

            {/* Fill bar */}
            <div
              className="w-full h-[8px] bg-[var(--color-bg)] rounded-[4px] overflow-hidden mb-2"
            >
              <div
                className="h-full rounded-[4px]" style={{ width: `${Math.min(sp.fill_percentage, 100)}%`, backgroundColor: fillColor, transition: 'width 0.3s ease' }}
              />
            </div>

            {/* Stats row */}
            <div
              className="flex justify-between items-center mb-1.5"
            >
              <div
                className="flex items-center gap-1"
              >
                <Droplet size={10} style={{ color: fillColor }} />
                <span
                  className="font-[var(--font-mono)] text-[11px] font-bold" style={{ color: fillColor }}
                >
                  {sp.fill_percentage.toFixed(1)}%
                </span>
              </div>
              <span
                className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
              >
                {sp.current_gallons.toLocaleString()} / {sp.capacity_gallons.toLocaleString()} gal
              </span>
            </div>

            {/* MGRS location */}
            {sp.mgrs && (
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.5px] mt-1"
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
