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
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-text)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: barColor,
          }}
        >
          {assigned} / {authorized}{' '}
          <span style={{ fontWeight: 700 }}>({pct}%)</span>
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 10px',
        backgroundColor: 'var(--color-bg)',
        border: `1px solid ${warn ? 'rgba(248, 113, 113, 0.3)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius)',
        minWidth: 60,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 16,
          fontWeight: 700,
          color: warn ? '#f87171' : 'var(--color-text-bright)',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginTop: 2,
        }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header: total fill */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
            }}
          >
            {strength.totalAssigned} / {strength.totalAuthorized} AUTHORIZED
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 700,
              color: totalBarColor,
            }}
          >
            {totalFillPct}% FILL
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(totalFillPct, 100)}%`,
              height: '100%',
              backgroundColor: totalBarColor,
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }}
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
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--color-text-muted)',
            marginBottom: 8,
          }}
        >
          STATUS BREAKDOWN
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--color-text-muted)',
              marginBottom: 8,
            }}
          >
            MOS SHORTFALLS
          </div>
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 70px 70px 70px',
                gap: 0,
                backgroundColor: 'var(--color-bg)',
                borderBottom: '1px solid var(--color-border)',
                padding: '6px 12px',
              }}
            >
              {['MOS', 'TITLE', 'AUTH', 'ASGN', 'SHORT'].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            {/* Table rows */}
            {strength.mosShortfalls.map((row) => (
              <div
                key={row.mos}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 70px 70px 70px',
                  gap: 0,
                  padding: '6px 12px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                  }}
                >
                  {row.mos}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.mosTitle}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text)',
                  }}
                >
                  {row.authorized}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text)',
                  }}
                >
                  {row.assigned}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#f87171',
                  }}
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
