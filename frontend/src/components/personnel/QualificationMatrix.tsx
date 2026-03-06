// =============================================================================
// QualificationMatrix — Qualification currency + P-Rating display
// =============================================================================

import type { QualStatusData, PersonnelReadinessData } from '@/lib/types';

interface QualificationMatrixProps {
  quals: Record<string, QualStatusData>;
  readiness: PersonnelReadinessData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function qualColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 75) return '#fbbf24';
  return '#f87171';
}

function pRatingColor(rating: string): string {
  switch (rating) {
    case 'P1': return '#4ade80';
    case 'P2': return '#60a5fa';
    case 'P3': return '#fbbf24';
    case 'P4': return '#fb923c';
    case 'P5': return '#f87171';
    default: return '#94a3b8';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QualificationMatrix({ quals, readiness }: QualificationMatrixProps) {
  const qualEntries = Object.entries(quals);

  return (
    <div className="flex flex-col gap-6">
      {/* P-Rating badge */}
      <div
        className="flex items-center gap-5 py-4 px-5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
      >
        <div
          className="flex items-center justify-center w-[56px] h-[56px]" style={{ borderRadius: '50%', border: `3px solid ${pRatingColor(readiness.p_rating)}`, backgroundColor: `${pRatingColor(readiness.p_rating)}15` }}
        >
          <span
            className="font-[var(--font-mono)] text-lg font-bold" style={{ color: pRatingColor(readiness.p_rating) }}
          >
            {readiness.p_rating}
          </span>
        </div>

        <div className="flex-1">
          <div
            className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)] mb-1.5"
          >
            PERSONNEL READINESS: {readiness.percent_ready.toFixed(1)}%
          </div>
          <div
            className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] leading-relaxed"
          >
            Fill Rate (50%): {readiness.fill_rate_pct.toFixed(1)}% | Qualifications (30%): {readiness.qualification_pct.toFixed(1)}% | Fitness (20%): {readiness.fitness_pct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Qualification progress bars */}
      <div>
        <div
          className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-3.5"
        >
          QUALIFICATION CURRENCY
        </div>

        <div className="flex flex-col gap-3.5">
          {qualEntries.map(([name, data]) => {
            const color = qualColor(data.percent);
            return (
              <div key={name}>
                <div
                  className="flex justify-between items-center mb-1.5"
                >
                  <span
                    className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)] uppercase"
                  >
                    {name}
                  </span>
                  <span
                    className="font-[var(--font-mono)] text-[11px] font-bold"
                  >
                    {data.current}/{data.total} ({data.percent.toFixed(1)}%)
                  </span>
                </div>
                <div
                  className="w-full h-[8px] bg-[rgba(255,255,255,0.06)] rounded-[4px] overflow-hidden"
                >
                  <div
                    className="h-full rounded-[4px]" style={{ width: `${Math.min(data.percent, 100)}%`, backgroundColor: color, transition: 'width 0.5s ease' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown weights */}
      <div
        className="py-3.5 px-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
      >
        <div
          className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-3"
        >
          P-RATING FORMULA
        </div>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'FILL RATE', weight: '50%', value: readiness.fill_rate_pct, color: qualColor(readiness.fill_rate_pct) },
            { label: 'QUALIFICATIONS', weight: '30%', value: readiness.qualification_pct, color: qualColor(readiness.qualification_pct) },
            { label: 'FITNESS', weight: '20%', value: readiness.fitness_pct, color: qualColor(readiness.fitness_pct) },
          ].map((item) => (
            <div
              key={item.label}
              className="py-2.5 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] flex-[1_1_120px]"
            >
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mb-1"
              >
                {item.label} ({item.weight})
              </div>
              <div
                className="font-[var(--font-mono)] text-base font-bold" style={{ color: item.color }}
              >
                {item.value.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
