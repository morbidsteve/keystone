import { useState } from 'react';
import { SupplyClass, SupplyStatus } from '@/lib/types';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import SupplyTable from '@/components/supply/SupplyTable';
import SupplyClassBreakdown from '@/components/supply/SupplyClassBreakdown';
import DOSCalculator from '@/components/supply/DOSCalculator';
import ConsumptionChart from '@/components/dashboard/ConsumptionChart';

export default function SupplyPage() {
  const [classFilter, setClassFilter] = useState<SupplyClass | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<SupplyStatus | undefined>(undefined);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            SUPPLY CLASS
          </label>
          <select
            value={classFilter || ''}
            onChange={(e) =>
              setClassFilter(e.target.value ? (e.target.value as SupplyClass) : undefined)
            }
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            <option value="">ALL CLASSES</option>
            {Object.values(SupplyClass).map((sc) => (
              <option key={sc} value={sc}>
                {SUPPLY_CLASS_SHORT[sc]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            STATUS
          </label>
          <select
            value={statusFilter || ''}
            onChange={(e) =>
              setStatusFilter(e.target.value ? (e.target.value as SupplyStatus) : undefined)
            }
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            <option value="">ALL</option>
            <option value={SupplyStatus.GREEN}>GREEN</option>
            <option value={SupplyStatus.AMBER}>AMBER</option>
            <option value={SupplyStatus.RED}>RED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="responsive-table-wrapper">
        <SupplyTable classFilter={classFilter} statusFilter={statusFilter} />
      </div>

      {/* Bottom Row: Breakdown + Charts + Calculator */}
      <div className="grid-responsive-1fr1fr320">
        <SupplyClassBreakdown className={classFilter ? SUPPLY_CLASS_SHORT[classFilter] : undefined} />
        <ConsumptionChart title="CONSUMPTION TREND" />
        <DOSCalculator />
      </div>
    </div>
  );
}
