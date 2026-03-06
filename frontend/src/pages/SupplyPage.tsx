import { useState } from 'react';
import { SupplyClass, SupplyStatus } from '@/lib/types';
import { SUPPLY_CLASS_SHORT } from '@/lib/constants';
import SupplyTable from '@/components/supply/SupplyTable';
import SupplyClassBreakdown from '@/components/supply/SupplyClassBreakdown';
import DOSCalculator from '@/components/supply/DOSCalculator';
import ConsumptionChart from '@/components/dashboard/ConsumptionChart';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function SupplyPage() {
  const [classFilter, setClassFilter] = useState<SupplyClass | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<SupplyStatus | undefined>(undefined);
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div>
          <label
            className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
          >
            SUPPLY CLASS
          </label>
          <select
            value={classFilter || ''}
            onChange={(e) =>
              setClassFilter(e.target.value ? (e.target.value as SupplyClass) : undefined)
            }
            className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
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
            className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
          >
            STATUS
          </label>
          <select
            value={statusFilter || ''}
            onChange={(e) =>
              setStatusFilter(e.target.value ? (e.target.value as SupplyStatus) : undefined)
            }
            className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
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
        <SupplyTable unitFilter={selectedUnitId ?? undefined} classFilter={classFilter} statusFilter={statusFilter} />
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
