// =============================================================================
// EASTimeline — Personnel EAS (End of Active Service) timeline view
// =============================================================================

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { EASRecord } from '@/lib/types';

interface EASTimelineProps {
  losses: EASRecord[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function urgencyColor(days: number): string {
  if (days <= 30) return '#f87171';
  if (days <= 60) return '#fbbf24';
  return '#60a5fa';
}

function urgencyBg(days: number): string {
  if (days <= 30) return 'rgba(248, 113, 113, 0.08)';
  if (days <= 60) return 'rgba(251, 191, 36, 0.08)';
  return 'rgba(96, 165, 250, 0.08)';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EASTimeline({ losses }: EASTimelineProps) {
  const buckets = useMemo(() => {
    const b30 = losses.filter((l) => l.days_until_eas <= 30);
    const b60 = losses.filter((l) => l.days_until_eas > 30 && l.days_until_eas <= 60);
    const b90 = losses.filter((l) => l.days_until_eas > 60 && l.days_until_eas <= 90);
    return { total: losses.length, within30: b30.length, within60: b60.length, within90: b90.length };
  }, [losses]);

  if (losses.length === 0) {
    return (
      <div
        className="p-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]"
      >
        No personnel EASing within 90 days
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div
        className="flex gap-3 flex-wrap"
      >
        {[
          { label: 'TOTAL EASing', value: buckets.total, color: 'var(--color-text-bright)' },
          { label: '0-30 DAYS', value: buckets.within30, color: '#f87171' },
          { label: '31-60 DAYS', value: buckets.within60, color: '#fbbf24' },
          { label: '61-90 DAYS', value: buckets.within90, color: '#60a5fa' },
        ].map((item) => (
          <div
            key={item.label}
            className="py-2.5 px-3.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] min-w-[110px] text-center"
          >
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1"
            >
              {item.label}
            </div>
            <div
              className="font-[var(--font-mono)] text-xl font-bold" style={{ color: item.color }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div
        className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
      >
        {losses.map((person) => {
          const color = urgencyColor(person.days_until_eas);
          const bg = urgencyBg(person.days_until_eas);
          return (
            <div
              key={person.id}
              className="py-3 px-3.5 rounded-[var(--radius)] flex flex-col gap-1.5" style={{ backgroundColor: bg, border: `1px solid ${color}40`, borderLeft: `3px solid ${color}` }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)]"
                >
                  {person.rank} {person.last_name}
                </span>
                <span
                  className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[10px] font-bold"
                >
                  <Clock size={11} />
                  {person.days_until_eas}D
                </span>
              </div>

              <div
                className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] flex gap-3 flex-wrap"
              >
                <span>MOS: {person.mos}</span>
                {person.billet && <span>BILLET: {person.billet}</span>}
              </div>

              <div
                className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
              >
                EAOS: {person.eaos}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
