// =============================================================================
// BilletTracker — Billet management view with vacancy tracking
// =============================================================================

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import type { BilletRecord } from '@/lib/types';

interface BilletTrackerProps {
  billets: BilletRecord[];
}

export default function BilletTracker({ billets }: BilletTrackerProps) {
  const stats = useMemo(() => {
    const total = billets.length;
    const filled = billets.filter((b) => b.is_filled).length;
    const vacant = total - filled;
    const keyVacancies = billets.filter((b) => b.is_key_billet && !b.is_filled);
    return { total, filled, vacant, keyVacancies };
  }, [billets]);

  const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    padding: '8px 10px',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    padding: '7px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'TOTAL BILLETS', value: stats.total, color: 'var(--color-text-bright)' },
          { label: 'FILLED', value: stats.filled, color: '#4ade80' },
          { label: 'VACANT', value: stats.vacant, color: stats.vacant > 0 ? '#f87171' : '#4ade80' },
          { label: 'KEY VACANCIES', value: stats.keyVacancies.length, color: stats.keyVacancies.length > 0 ? '#f87171' : '#4ade80' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
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
              {kpi.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: kpi.color,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Billet Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={headerStyle}>BILLET CODE</th>
              <th style={headerStyle}>TITLE</th>
              <th style={headerStyle}>MOS REQ</th>
              <th style={headerStyle}>RANK REQ</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>KEY?</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>FILLED?</th>
              <th style={headerStyle}>ASSIGNED TO</th>
            </tr>
          </thead>
          <tbody>
            {billets.map((b) => (
              <tr
                key={b.id}
                style={{
                  borderLeft: !b.is_filled ? '3px solid #f87171' : '3px solid transparent',
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ ...cellStyle, color: 'var(--color-accent)', fontWeight: 600 }}>
                  {b.billet_id_code}
                </td>
                <td style={{ ...cellStyle, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                  {b.billet_title}
                </td>
                <td style={cellStyle}>{b.mos_required ?? '—'}</td>
                <td style={cellStyle}>{b.rank_required ?? '—'}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  {b.is_key_billet && (
                    <Star size={13} style={{ color: '#fbbf24' }} />
                  )}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: b.is_filled ? '#4ade80' : '#f87171',
                    }}
                  />
                </td>
                <td style={cellStyle}>
                  {b.filled_by_name ?? (
                    <span style={{ color: '#f87171', fontStyle: 'italic', fontSize: 10 }}>
                      VACANT
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Billet Vacancies section */}
      {stats.keyVacancies.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: '#f87171',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            KEY BILLET VACANCIES
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 10,
            }}
          >
            {stats.keyVacancies.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderLeft: '3px solid #f87171',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={12} style={{ color: '#fbbf24' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-text-bright)',
                    }}
                  >
                    {b.billet_title}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <span>{b.billet_id_code}</span>
                  <span>MOS: {b.mos_required ?? 'ANY'}</span>
                  <span>RANK: {b.rank_required ?? 'ANY'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
