// =============================================================================
// StrengthTable — Personnel strength display with fill bars and MOS shortfalls
// =============================================================================

import type { UnitStrengthReport } from '@/lib/types';

interface StrengthTableProps {
  strength: UnitStrengthReport;
}

function getBarColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  if (pct >= 60) return '#fb923c';
  return '#f87171';
}

function FillBar({ label, assigned, authorized }: { label: string; assigned: number; authorized: number }) {
  const pct = authorized > 0 ? Math.round((assigned / authorized) * 1000) / 10 : 0;
  const barColor = getBarColor(pct);

  return (
    <div className="mb-2.5">
      <div
        className="flex justify-between items-baseline mb-1"
      >
        <span
          className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text)] uppercase tracking-[1px]"
        >
          {label}
        </span>
        <span
          className="font-[var(--font-mono)] text-[10px]" style={{ color: barColor }}
        >
          {assigned} / {authorized}{' '}
          <span className="font-bold">({pct}%)</span>
        </span>
      </div>
      <div
        className="w-full h-[6px] bg-[rgba(255,255,255,0.06)] rounded-[3px] overflow-hidden"
      >
        <div
          className="h-full rounded-[3px]" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, transition: 'width 0.4s ease' }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div
      className="flex flex-col items-center py-1.5 px-2.5 bg-[var(--color-bg)] rounded-[var(--radius)] min-w-[60px]" style={{ border: `1px solid ${warn ? 'rgba(248, 113, 113, 0.3)' : 'var(--color-border)'}` }}
    >
      <span
        className="font-[var(--font-mono)] text-base font-bold" style={{ color: warn ? '#f87171' : 'var(--color-text-bright)' }}
      >
        {value}
      </span>
      <span
        className="font-[var(--font-mono)] text-[8px] text-[var(--color-text-muted)] uppercase tracking-[0.5px] mt-0.5"
      >
        {label}
      </span>
    </div>
  );
}

export default function StrengthTable({ strength }: StrengthTableProps) {
  const totalFillPct =
    strength.totalAuthorized > 0
      ? Math.round((strength.totalAssigned / strength.totalAuthorized) * 1000) / 10
      : 0;
  const totalBarColor = getBarColor(totalFillPct);

  return (
    <div className="flex flex-col gap-4">
      {/* Header: total fill */}
      <div>
        <div
          className="flex justify-between items-baseline mb-1.5"
        >
          <span
            className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)]"
          >
            {strength.totalAssigned} / {strength.totalAuthorized} AUTHORIZED
          </span>
          <span
            className="font-[var(--font-mono)] text-lg font-bold" style={{ color: totalBarColor }}
          >
            {totalFillPct}% FILL
          </span>
        </div>
        <div
          className="w-full h-[8px] bg-[rgba(255,255,255,0.06)] rounded-[4px] overflow-hidden"
        >
          <div
            className="h-full rounded-[4px]" style={{ width: `${Math.min(totalFillPct, 100)}%`, backgroundColor: totalBarColor, transition: 'width 0.4s ease' }}
          />
        </div>
      </div>

      {/* Officer / Enlisted rows */}
      <div>
        <FillBar
          label="Officers"
          assigned={strength.assignedOfficers}
          authorized={strength.authorizedOfficers}
        />
        <FillBar
          label="Enlisted"
          assigned={strength.assignedEnlisted}
          authorized={strength.authorizedEnlisted}
        />
      </div>

      {/* Status breakdown chips */}
      <div>
        <div
          className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2"
        >
          STATUS BREAKDOWN
        </div>
        <div className="flex flex-wrap gap-2">
          <StatChip label="Attached" value={strength.attached} />
          <StatChip label="Detached" value={strength.detached} />
          <StatChip label="TAD" value={strength.tad} />
          <StatChip label="Leave" value={strength.leave} />
          <StatChip label="Medical" value={strength.medical} />
          <StatChip label="UA" value={strength.ua} warn={strength.ua > 0} />
        </div>
      </div>

      {/* MOS Shortfall Table */}
      {strength.mosShortfalls && strength.mosShortfalls.length > 0 && (
        <div>
          <div
            className="font-[var(--font-mono)] text-[9px] font-semibold uppercase tracking-[1.5px] text-[var(--color-text-muted)] mb-2"
          >
            MOS SHORTFALLS
          </div>
          <div
            className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden"
          >
            {/* Table header */}
            <div
              className="grid gap-0 bg-[var(--color-bg)] border-b border-b-[var(--color-border)] py-1.5 px-3" style={{ gridTemplateColumns: '60px 1fr 70px 70px 70px' }}
            >
              {['MOS', 'TITLE', 'AUTH', 'ASGN', 'SHORT'].map((h) => (
                <span
                  key={h}
                  className="font-[var(--font-mono)] text-[8px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]"
                >
                  {h}
                </span>
              ))}
            </div>
            {/* Table rows */}
            {strength.mosShortfalls.map((row) => (
              <div
                key={row.mos}
                className="grid gap-0 py-1.5 px-3 border-b border-b-[var(--color-border)]" style={{ gridTemplateColumns: '60px 1fr 70px 70px 70px' }}
              >
                <span
                  className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-accent)]"
                >
                  {row.mos}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {row.mosTitle}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
                >
                  {row.authorized}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
                >
                  {row.assigned}
                </span>
                <span
                  className="font-[var(--font-mono)] text-[11px] font-bold text-[#f87171]"
                >
                  -{row.shortfall}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
