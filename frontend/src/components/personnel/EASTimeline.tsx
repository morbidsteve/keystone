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
        style={{
          padding: 40,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        No personnel EASing within 90 days
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'TOTAL EASing', value: buckets.total, color: 'var(--color-text-bright)' },
          { label: '0-30 DAYS', value: buckets.within30, color: '#f87171' },
          { label: '31-60 DAYS', value: buckets.within60, color: '#fbbf24' },
          { label: '61-90 DAYS', value: buckets.within90, color: '#60a5fa' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              minWidth: 110,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '1.5px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: item.color,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {losses.map((person) => {
          const color = urgencyColor(person.days_until_eas);
          const bg = urgencyBg(person.days_until_eas);
          return (
            <div
              key={person.id}
              style={{
                padding: '12px 14px',
                backgroundColor: bg,
                border: `1px solid ${color}40`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-text-bright)',
                  }}
                >
                  {person.rank} {person.last_name}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color,
                  }}
                >
                  <Clock size={11} />
                  {person.days_until_eas}D
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span>MOS: {person.mos}</span>
                {person.billet && <span>BILLET: {person.billet}</span>}
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                }}
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
