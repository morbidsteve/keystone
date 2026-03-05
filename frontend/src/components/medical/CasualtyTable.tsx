// =============================================================================
// CasualtyTable — Active casualty report tracker
// =============================================================================

import { useState, useMemo } from 'react';
import { Clock, Heart, MapPin, Users } from 'lucide-react';
import type { CasualtyReport } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';
import { CASEVACPrecedence, CasualtyReportStatus, EvacuationStatus, TriageCategory } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRECEDENCE_ORDER: Record<string, number> = {
  [CASEVACPrecedence.URGENT_SURGICAL]: 0,
  [CASEVACPrecedence.URGENT]: 1,
  [CASEVACPrecedence.PRIORITY]: 2,
  [CASEVACPrecedence.ROUTINE]: 3,
  [CASEVACPrecedence.CONVENIENCE]: 4,
};

const precedenceColor = (p: CASEVACPrecedence): string => {
  switch (p) {
    case CASEVACPrecedence.URGENT_SURGICAL: return '#ef4444';
    case CASEVACPrecedence.URGENT: return '#f97316';
    case CASEVACPrecedence.PRIORITY: return '#eab308';
    case CASEVACPrecedence.ROUTINE: return '#22c55e';
    case CASEVACPrecedence.CONVENIENCE: return '#3b82f6';
  }
};

const statusColor = (s: CasualtyReportStatus): string => {
  switch (s) {
    case CasualtyReportStatus.REPORTED: return '#ef4444';
    case CasualtyReportStatus.ACKNOWLEDGED: return '#f97316';
    case CasualtyReportStatus.DISPATCHED: return '#eab308';
    case CasualtyReportStatus.EVACUATING: return '#3b82f6';
    case CasualtyReportStatus.AT_MTF: return '#8b5cf6';
    case CasualtyReportStatus.CLOSED: return '#6b7280';
  }
};

const evacColor = (e: EvacuationStatus | null): string => {
  if (!e) return '#6b7280';
  switch (e) {
    case EvacuationStatus.PENDING: return '#ef4444';
    case EvacuationStatus.IN_TRANSIT: return '#3b82f6';
    case EvacuationStatus.AT_FACILITY: return '#8b5cf6';
    case EvacuationStatus.TREATED: return '#22c55e';
    case EvacuationStatus.RTD: return '#6b7280';
  }
};

const triageColor = (t: TriageCategory | null): string => {
  if (!t) return '#6b7280';
  switch (t) {
    case TriageCategory.IMMEDIATE: return '#ef4444';
    case TriageCategory.DELAYED: return '#eab308';
    case TriageCategory.MINIMAL: return '#22c55e';
    case TriageCategory.EXPECTANT: return '#6b7280';
  }
};

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h ago`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'precedence' | 'status' | 'reported' | 'patients';

interface CasualtyTableProps {
  casualties: CasualtyReport[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CasualtyTable({ casualties }: CasualtyTableProps) {
  const [sortField, setSortField] = useState<SortField>('precedence');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...casualties];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'precedence':
          cmp = (PRECEDENCE_ORDER[a.precedence] ?? 99) - (PRECEDENCE_ORDER[b.precedence] ?? 99);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'reported':
          cmp = new Date(a.reported_datetime).getTime() - new Date(b.reported_datetime).getTime();
          break;
        case 'patients':
          cmp = a.number_of_patients - b.number_of_patients;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [casualties, sortField, sortAsc]);

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
    padding: '8px 10px',
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
    padding: '8px 10px',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 2,
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.5px',
    color,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}40`,
  });

  if (casualties.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={32} />}
        title="NO CASUALTY REPORTS"
        message="Active casualty reports will appear here"
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerStyle}>CASUALTY ID</th>
            <th style={headerStyle} onClick={() => handleSort('precedence')}>
              PRECEDENCE {sortField === 'precedence' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
            </th>
            <th style={headerStyle}>TRIAGE</th>
            <th style={headerStyle} onClick={() => handleSort('status')}>
              STATUS {sortField === 'status' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
            </th>
            <th style={headerStyle}>EVAC STATUS</th>
            <th style={headerStyle}>LOCATION</th>
            <th style={headerStyle}>MECHANISM</th>
            <th style={headerStyle} onClick={() => handleSort('patients')}>
              <Users size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              PAX {sortField === 'patients' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
            </th>
            <th style={headerStyle} onClick={() => handleSort('reported')}>
              <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              REPORTED {sortField === 'reported' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr
              key={c.id}
              style={{
                transition: 'background-color var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--color-text-bright)' }}>
                {c.casualty_id}
              </td>
              <td style={cellStyle}>
                <span style={badgeStyle(precedenceColor(c.precedence))}>
                  {formatLabel(c.precedence)}
                </span>
              </td>
              <td style={cellStyle}>
                {c.triage_category ? (
                  <span style={badgeStyle(triageColor(c.triage_category))}>
                    {formatLabel(c.triage_category)}
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>--</span>
                )}
              </td>
              <td style={cellStyle}>
                <span style={badgeStyle(statusColor(c.status))}>
                  {formatLabel(c.status)}
                </span>
              </td>
              <td style={cellStyle}>
                <span style={badgeStyle(evacColor(c.evacuation_status))}>
                  {c.evacuation_status ? formatLabel(c.evacuation_status) : '--'}
                </span>
              </td>
              <td style={{ ...cellStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <MapPin size={10} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--color-text-muted)' }} />
                {c.location_description || c.location_mgrs || `${c.location_lat.toFixed(4)}, ${c.location_lon.toFixed(4)}`}
              </td>
              <td style={{ ...cellStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 10 }}>
                {c.mechanism_of_injury || '--'}
              </td>
              <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>
                {c.number_of_patients}
              </td>
              <td style={{ ...cellStyle, color: 'var(--color-text-muted)', fontSize: 10 }}>
                {relativeTime(c.reported_datetime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
