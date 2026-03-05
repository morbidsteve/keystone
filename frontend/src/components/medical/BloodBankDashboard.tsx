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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <label
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 4,
              display: 'block',
            }}
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <Users size={14} style={{ color: 'var(--color-accent)' }} />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              WALKING BLOOD BANK
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--color-text-bright)',
              }}
            >
              {totalWBBDonors} <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>DONORS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Blood Type Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {bloodTypeCards.map((card) => {
          const isCritical = card.totalUnits <= 2 && card.products.length > 0;
          const expiryDays = daysUntil(card.earliestExpiry);
          const expiryWarning = expiryDays !== null && expiryDays <= 7;
          const borderColor = isCritical ? '#ef4444' : 'var(--color-border)';

          return (
            <div
              key={card.bloodType}
              style={{
                backgroundColor: 'var(--color-bg)',
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius)',
                padding: 14,
                position: 'relative',
              }}
            >
              {isCritical && (
                <AlertTriangle
                  size={12}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: '#ef4444',
                  }}
                />
              )}

              {/* Blood Type Label */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: card.products.length > 0
                    ? (isCritical ? '#ef4444' : 'var(--color-text-bright)')
                    : 'var(--color-text-muted)',
                  marginBottom: 8,
                }}
              >
                <Droplets
                  size={14}
                  style={{
                    verticalAlign: 'middle',
                    marginRight: 4,
                    color: card.products.length > 0 ? '#ef4444' : 'var(--color-text-muted)',
                  }}
                />
                {card.label}
              </div>

              {/* Units On Hand */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                ON HAND
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: isCritical ? '#ef4444' : 'var(--color-text-bright)',
                  marginBottom: 8,
                }}
              >
                {card.totalUnits}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 400,
                    color: 'var(--color-text-muted)',
                    marginLeft: 4,
                  }}
                >
                  units
                </span>
              </div>

              {/* Used in 24h */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  USED 24H
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: card.totalUsed24h > 0 ? '#f59e0b' : 'var(--color-text-muted)',
                  }}
                >
                  {card.totalUsed24h}
                </span>
              </div>

              {/* WBB Donors */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  WBB
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                  }}
                >
                  {card.totalDonors}
                </span>
              </div>

              {/* Expiration Warning */}
              {card.earliestExpiry && (
                <div
                  style={{
                    marginTop: 6,
                    padding: '3px 6px',
                    borderRadius: 2,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    letterSpacing: '0.5px',
                    backgroundColor: expiryWarning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                    color: expiryWarning ? '#ef4444' : 'var(--color-text-muted)',
                    textAlign: 'center',
                  }}
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
