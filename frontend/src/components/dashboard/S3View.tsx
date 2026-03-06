import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import StatusDot from '@/components/ui/StatusDot';
import { SupplyStatus } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';
import { DEMO_UNITS } from '@/api/mockData';

// Demo unit sustainability data
const unitCards = [
  {
    id: '1-1',
    name: '1/1 BN',
    echelon: 'BATTALION',
    overallStatus: SupplyStatus.AMBER,
    readiness: 82,
    sustainability: 5,
    supplies: [
      { class: 'CL I', dos: 8, status: SupplyStatus.GREEN },
      { class: 'CL III', dos: 4, status: SupplyStatus.AMBER },
      { class: 'CL V', dos: 2, status: SupplyStatus.RED },
      { class: 'CL VIII', dos: 14, status: SupplyStatus.GREEN },
      { class: 'CL IX', dos: 7, status: SupplyStatus.GREEN },
    ],
    constraints: ['CL V resupply delayed 24hrs', 'AAV parts on backorder'],
  },
  {
    id: '2-1',
    name: '2/1 BN',
    echelon: 'BATTALION',
    overallStatus: SupplyStatus.GREEN,
    readiness: 91,
    sustainability: 8,
    supplies: [
      { class: 'CL I', dos: 10, status: SupplyStatus.GREEN },
      { class: 'CL III', dos: 7, status: SupplyStatus.GREEN },
      { class: 'CL V', dos: 6, status: SupplyStatus.AMBER },
      { class: 'CL VIII', dos: 12, status: SupplyStatus.GREEN },
      { class: 'CL IX', dos: 9, status: SupplyStatus.GREEN },
    ],
    constraints: [],
  },
  {
    id: '3-1',
    name: '3/1 BN',
    echelon: 'BATTALION',
    overallStatus: SupplyStatus.RED,
    readiness: 68,
    sustainability: 3,
    supplies: [
      { class: 'CL I', dos: 5, status: SupplyStatus.AMBER },
      { class: 'CL III', dos: 2, status: SupplyStatus.RED },
      { class: 'CL V', dos: 1, status: SupplyStatus.RED },
      { class: 'CL VIII', dos: 6, status: SupplyStatus.AMBER },
      { class: 'CL IX', dos: 3, status: SupplyStatus.AMBER },
    ],
    constraints: ['CL III emergency resupply requested', 'CL V black - requesting emergency push', 'Multiple NMC vehicles awaiting parts'],
  },
];

const movementFeasibility = [
  { name: 'MSR ALPHA', status: 'GREEN', detail: 'Open, no restrictions' },
  { name: 'MSR BRAVO', status: 'AMBER', detail: 'Bridge weight limit 20T' },
  { name: 'ASR CHARLIE', status: 'RED', detail: 'Closed - IED threat' },
];

// Map S3View card IDs to DEMO_UNITS abbreviations for filtering
const cardUnitMapping: Record<string, string[]> = {
  '1-1': ['1/1'],
  '2-1': ['2/1'],
  '3-1': ['3/1'],
};

function getDescendantUnitIds(unitId: string): string[] {
  const ids = new Set<string>([unitId]);
  let added = true;
  while (added) {
    added = false;
    for (const u of DEMO_UNITS) {
      if (u.parentId && ids.has(u.parentId) && !ids.has(u.id)) {
        ids.add(u.id);
        added = true;
      }
    }
  }
  return Array.from(ids);
}

export default function S3View() {
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  const filteredUnitCards = useMemo(() => {
    if (!selectedUnitId) return unitCards;
    const validIds = getDescendantUnitIds(selectedUnitId);
    const validAbbrevs = DEMO_UNITS.filter((u) => validIds.includes(u.id)).map((u) => u.abbreviation);
    return unitCards.filter((card) => {
      const mappedAbbrevs = cardUnitMapping[card.id] || [card.name];
      return mappedAbbrevs.some((a) => validAbbrevs.some((v) => v.includes(a) || a.includes(v)));
    });
  }, [selectedUnitId]);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Unit Sustainability Cards */}
      <div>
        <div className="section-header mb-3 pl-0.5" >
          UNIT SUSTAINABILITY OVERLAY
        </div>
        <div className="grid-responsive-3col">
          {filteredUnitCards.map((unit) => {
            const color = getStatusColor(unit.overallStatus);
            return (
              <div
                key={unit.id}
                className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] p-4" style={{ borderTop: `2px solid ${color}` }}
              >
                {/* Unit Header */}
                <div
                  className="flex justify-between items-center mb-3"
                >
                  <div>
                    <div
                      className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)]"
                    >
                      {unit.name}
                    </div>
                    <div
                      className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px] uppercase"
                    >
                      {unit.echelon}
                    </div>
                  </div>
                  <StatusBadge status={unit.overallStatus} />
                </div>

                {/* Key Stats */}
                <div
                  className="grid gap-2 mb-3 py-2 px-0 border-t border-t-[var(--color-border)] border-b border-b-[var(--color-border)] grid-cols-2"
                >
                  <div>
                    <div className="section-header mb-0.5">
                      READINESS
                    </div>
                    <div
                      className="font-[var(--font-mono)] text-xl font-bold" style={{ color: getStatusColor(
                          unit.readiness >= 90
                            ? SupplyStatus.GREEN
                            : unit.readiness >= 75
                            ? SupplyStatus.AMBER
                            : SupplyStatus.RED,
                        ) }}
                    >
                      {unit.readiness}%
                    </div>
                  </div>
                  <div>
                    <div className="section-header mb-0.5">
                      SUSTAINABILITY
                    </div>
                    <div
                      className="font-[var(--font-mono)] text-xl font-bold" style={{ color: getStatusColor(
                          unit.sustainability >= 7
                            ? SupplyStatus.GREEN
                            : unit.sustainability >= 3
                            ? SupplyStatus.AMBER
                            : SupplyStatus.RED,
                        ) }}
                    >
                      {unit.sustainability}D
                    </div>
                  </div>
                </div>

                {/* Supply DOS */}
                <div className="mb-2.5">
                  <div className="section-header mb-1.5">
                    SUPPLY DOS
                  </div>
                  <div className="flex flex-col gap-1">
                    {unit.supplies.map((s) => (
                      <div
                        key={s.class}
                        className="flex items-center gap-2 font-[var(--font-mono)] text-[10px]"
                      >
                        <StatusDot status={s.status} size={6} />
                        <span className="w-[50px] text-[var(--color-text-muted)]">
                          {s.class}
                        </span>
                        <div
                          className="flex-1 h-[4px] bg-[var(--color-bg)] rounded-[2px] overflow-hidden"
                        >
                          <div
                            className="h-full rounded-[2px]" style={{ width: `${Math.min((s.dos / 14) * 100, 100)}%`, backgroundColor: getStatusColor(s.status) }}
                          />
                        </div>
                        <span className="w-[28px] text-right" style={{ color: getStatusColor(s.status) }}>
                          {s.dos}D
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                {unit.constraints.length > 0 && (
                  <div>
                    <div className="section-header mb-1 text-[var(--color-warning)]" >
                      CONSTRAINTS
                    </div>
                    {unit.constraints.map((c, i) => (
                      <div
                        key={i}
                        className="text-[10px] text-[var(--color-text-muted)] py-0.5 px-0 pl-2 mb-[3px]" style={{ borderLeft: '2px solid var(--color-warning)' }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Movement Feasibility */}
      <Card title="MOVEMENT ROUTE STATUS">
        <div className="flex flex-col gap-1.5">
          {movementFeasibility.map((route) => (
            <div
              key={route.name}
              className="flex items-center gap-3 py-2 px-3 bg-[var(--color-bg-surface)] rounded-[var(--radius)] border border-[var(--color-border)]"
            >
              <StatusDot status={route.status} />
              <span
                className="font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-bright)] w-[100px]"
              >
                {route.name}
              </span>
              <span
                className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
              >
                {route.detail}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
