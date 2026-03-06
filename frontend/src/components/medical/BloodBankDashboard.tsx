// =============================================================================
// BloodBankDashboard — Blood product inventory by facility
// =============================================================================

import { useState, useMemo } from 'react';
import { Droplets, AlertTriangle, Users } from 'lucide-react';
import type { BloodProductRecord, MedicalFacility } from '@/lib/types';
import { BloodTypeEnum } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BLOOD_TYPE_LABELS: Record<string, string> = {
  [BloodTypeEnum.O_NEG]: 'O-',
  [BloodTypeEnum.O_POS]: 'O+',
  [BloodTypeEnum.A_NEG]: 'A-',
  [BloodTypeEnum.A_POS]: 'A+',
  [BloodTypeEnum.B_NEG]: 'B-',
  [BloodTypeEnum.B_POS]: 'B+',
  [BloodTypeEnum.AB_NEG]: 'AB-',
  [BloodTypeEnum.AB_POS]: 'AB+',
};

const BLOOD_TYPE_ORDER = [
  BloodTypeEnum.O_NEG, BloodTypeEnum.O_POS,
  BloodTypeEnum.A_NEG, BloodTypeEnum.A_POS,
  BloodTypeEnum.B_NEG, BloodTypeEnum.B_POS,
  BloodTypeEnum.AB_NEG, BloodTypeEnum.AB_POS,
];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BloodBankDashboardProps {
  products: BloodProductRecord[];
  facilities: MedicalFacility[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BloodBankDashboard({ products, facilities }: BloodBankDashboardProps) {
  const facilitiesWithBlood = useMemo(() => {
    const ids = new Set(products.map((p) => p.facility_id));
    return facilities.filter((f) => ids.has(f.id));
  }, [products, facilities]);

  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    facilitiesWithBlood.length > 0 ? facilitiesWithBlood[0].id : null,
  );

  const filteredProducts = useMemo(() => {
    if (!selectedFacilityId) return products;
    return products.filter((p) => p.facility_id === selectedFacilityId);
  }, [products, selectedFacilityId]);

  // Aggregate by blood type
  const bloodTypeCards = useMemo(() => {
    return BLOOD_TYPE_ORDER.map((bt) => {
      const matching = filteredProducts.filter((p) => p.blood_type === bt);
      const totalUnits = matching.reduce((sum, p) => sum + p.units_on_hand, 0);
      const totalUsed24h = matching.reduce((sum, p) => sum + p.units_used_24h, 0);
      const totalDonors = matching.reduce((sum, p) => sum + p.walking_blood_bank_donors, 0);
      const earliestExpiry = matching
        .map((p) => p.expiration_date)
        .filter(Boolean)
        .sort()[0] ?? null;

      return {
        bloodType: bt,
        label: BLOOD_TYPE_LABELS[bt],
        totalUnits,
        totalUsed24h,
        totalDonors,
        earliestExpiry,
        products: matching,
      };
    });
  }, [filteredProducts]);

  const totalWBBDonors = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + p.walking_blood_bank_donors, 0);
  }, [filteredProducts]);

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--color-text-bright)',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
    minWidth: 220,
  };

  return (
    <div>
      {/* Facility Selector + WBB Summary */}
      <div
        className="flex items-center justify-between mb-4 flex-wrap gap-3"
      >
        <div>
          <label
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)] mb-1 block"
          >
            FACILITY
          </label>
          <select
            style={selectStyle}
            value={selectedFacilityId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedFacilityId(val ? parseInt(val) : null);
            }}
          >
            <option value="">ALL FACILITIES</option>
            {facilitiesWithBlood.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.facility_type})
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex items-center gap-2 py-2 px-3.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
        >
          <Users size={14} className="text-[var(--color-accent)]" />
          <div>
            <div
              className="font-[var(--font-mono)] text-[9px] tracking-[1.5px] text-[var(--color-text-muted)] uppercase"
            >
              WALKING BLOOD BANK
            </div>
            <div
              className="font-[var(--font-mono)] text-lg font-bold text-[var(--color-text-bright)]"
            >
              {totalWBBDonors} <span className="text-[10px] text-[var(--color-text-muted)]">DONORS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blood Type Grid */}
      <div
        className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]"
      >
        {bloodTypeCards.map((card) => {
          const isCritical = card.totalUnits <= 2 && card.products.length > 0;
          const expiryDays = daysUntil(card.earliestExpiry);
          const expiryWarning = expiryDays !== null && expiryDays <= 7;
          const borderColor = isCritical ? '#ef4444' : 'var(--color-border)';

          return (
            <div
              key={card.bloodType}
              className="bg-[var(--color-bg)] rounded-[var(--radius)] p-3.5 relative" style={{ border: `1px solid ${borderColor}` }}
            >
              {isCritical && (
                <AlertTriangle
                  size={12}
                  className="absolute top-2 right-2 text-[#ef4444]"
                />
              )}

              {/* Blood Type Label */}
              <div
                className="font-[var(--font-mono)] text-[22px] font-bold mb-2" style={{ color: card.products.length > 0
                    ? (isCritical ? '#ef4444' : 'var(--color-text-bright)')
                    : 'var(--color-text-muted)' }}
              >
                <Droplets
                  size={14}
                  className="align-middle mr-1" style={{ color: card.products.length > 0 ? '#ef4444' : 'var(--color-text-muted)' }}
                />
                {card.label}
              </div>

              {/* Units On Hand */}
              <div
                className="font-[var(--font-mono)] text-[9px] tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-0.5"
              >
                ON HAND
              </div>
              <div
                className="font-[var(--font-mono)] text-xl font-bold mb-2" style={{ color: isCritical ? '#ef4444' : 'var(--color-text-bright)' }}
              >
                {card.totalUnits}
                <span
                  className="text-[10px] font-normal text-[var(--color-text-muted)] ml-1"
                >
                  units
                </span>
              </div>

              {/* Used in 24h */}
              <div
                className="flex justify-between mb-1"
              >
                <span
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] uppercase"
                >
                  USED 24H
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] font-semibold" style={{ color: card.totalUsed24h > 0 ? '#f59e0b' : 'var(--color-text-muted)' }}
                >
                  {card.totalUsed24h}
                </span>
              </div>

              {/* WBB Donors */}
              <div
                className="flex justify-between mb-1"
              >
                <span
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] uppercase"
                >
                  WBB
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-accent)]"
                >
                  {card.totalDonors}
                </span>
              </div>

              {/* Expiration Warning */}
              {card.earliestExpiry && (
                <div
                  className="mt-1.5 py-[3px] px-1.5 rounded-[2px] font-[var(--font-mono)] text-[8px] tracking-[0.5px] text-center" style={{ backgroundColor: expiryWarning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(107, 114, 128, 0.12)', color: expiryWarning ? '#ef4444' : 'var(--color-text-muted)' }}
                >
                  EXP: {expiryDays !== null ? `${expiryDays}d` : '--'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
