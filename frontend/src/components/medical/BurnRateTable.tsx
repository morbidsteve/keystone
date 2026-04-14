// =============================================================================
// BurnRateTable — Class VIII supply burn rate tracker
// =============================================================================

import { useState, useMemo } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import type { MedicalBurnRate } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dosColor(days: number | null): string {
  if (days === null) return '#6b7280';
  if (days < 3) return '#ef4444';
  if (days < 7) return '#f59e0b';
  return '#22c55e';
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'name' | 'onHand' | 'burnRate' | 'dos' | 'exhaustion';

interface BurnRateTableProps {
  burnRates: MedicalBurnRate[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BurnRateTable({ burnRates }: BurnRateTableProps) {
  const [sortField, setSortField] = useState<SortField>('dos');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...burnRates];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.supplyName.localeCompare(b.supplyName);
          break;
        case 'onHand':
          cmp = a.quantityOnHand - b.quantityOnHand;
          break;
        case 'burnRate':
          cmp = a.burnRatePerDay - b.burnRatePerDay;
          break;
        case 'dos':
          cmp = (a.daysOfSupply ?? 9999) - (b.daysOfSupply ?? 9999);
          break;
        case 'exhaustion': {
          const aDate = a.projectedExhaustionDate ? new Date(a.projectedExhaustionDate).getTime() : Infinity;
          const bDate = b.projectedExhaustionDate ? new Date(b.projectedExhaustionDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [burnRates, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortAsc ? ' \u25B2' : ' \u25BC') : '';

  if (burnRates.length === 0) {
    return (
      <EmptyState
        icon={<Activity size={32} />}
        title="NO BURN RATE DATA"
        message="Medical supply burn rate data will appear here"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th style={headerStyle} onClick={() => handleSort('name')}>
              SUPPLY NAME{sortIndicator('name')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('onHand')}>
              QTY ON HAND{sortIndicator('onHand')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('burnRate')}>
              BURN RATE/DAY{sortIndicator('burnRate')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('dos')}>
              DAYS OF SUPPLY{sortIndicator('dos')}
            </th>
            <th style={headerStyle} onClick={() => handleSort('exhaustion')}>
              PROJECTED EXHAUSTION{sortIndicator('exhaustion')}
            </th>
            <th style={{ ...headerStyle, textAlign: 'center' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((br) => {
            const color = dosColor(br.daysOfSupply);
            const isCritical = br.daysOfSupply !== null && br.daysOfSupply < 3;

            return (
              <tr
                key={br.id}
                className="transition-colors duration-[var(--transition)]"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <td className="text-[var(--color-text-bright)]">
                  {isCritical && (
                    <AlertTriangle
                      size={11}
                      className="align-middle mr-1.5 text-[#ef4444]"
                    />
                  )}
                  {br.supplyName}
                </td>
                <td className="font-semibold">
                  {br.quantityOnHand}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {br.burnRatePerDay.toFixed(2)}
                </td>
                <td
                  className="font-bold"
                >
                  {br.daysOfSupply !== null ? br.daysOfSupply : '--'}
                </td>
                <td className="text-[10px]">
                  {formatDate(br.projectedExhaustionDate)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span
                    className="inline-block py-0.5 px-2 rounded-[2px] font-[var(--font-mono)] text-[8px] font-bold tracking-[1px] uppercase" style={{ color,
                      backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
                  >
                    {br.daysOfSupply === null
                      ? 'UNKNOWN'
                      : br.daysOfSupply < 3
                        ? 'CRITICAL'
                        : br.daysOfSupply < 7
                          ? 'LOW'
                          : 'ADEQUATE'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
