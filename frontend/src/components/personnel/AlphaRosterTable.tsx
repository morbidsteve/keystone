// =============================================================================
// AlphaRosterTable — Sortable personnel roster with search/filter
// =============================================================================

import { useState, useMemo } from 'react';
import { Search, Users, Plus } from 'lucide-react';
import type { PersonnelRecord, RifleQual, DutyStatusType } from '@/lib/types';
import EmptyState from '@/components/ui/EmptyState';
import AddEditPersonnelModal from './AddEditPersonnelModal';
import { deletePersonnel } from '@/api/personnel';

interface AlphaRosterTableProps {
  personnel: PersonnelRecord[];
  onRefresh?: () => void;
}

type SortKey =
  | 'last_name'
  | 'edipi'
  | 'rank'
  | 'pay_grade'
  | 'mos'
  | 'billet'
  | 'status'
  | 'duty_status'
  | 'rifle_qual'
  | 'pft_score'
  | 'cft_score';

type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RANK_ORDER: Record<string, number> = {
  Pvt: 1, PFC: 2, LCpl: 3, Cpl: 4, Sgt: 5, SSgt: 6, GySgt: 7, MSgt: 8, '1stSgt': 9, MGySgt: 10, SgtMaj: 11,
  '2ndLt': 12, '1stLt': 13, Capt: 14, Maj: 15, LtCol: 16, Col: 17, BGen: 18, MajGen: 19, LtGen: 20, Gen: 21,
  W1: 22, W2: 23, W3: 24, W4: 25, W5: 26,
};

function rankSort(a: string | null, b: string | null): number {
  return (RANK_ORDER[a ?? ''] ?? 0) - (RANK_ORDER[b ?? ''] ?? 0);
}

function rifleQualColor(qual: RifleQual | null): string {
  switch (qual) {
    case 'EXPERT': return '#4ade80';
    case 'SHARPSHOOTER': return '#60a5fa';
    case 'MARKSMAN': return '#fbbf24';
    case 'UNQUAL': return '#f87171';
    default: return '#64748b';
  }
}

function dutyStatusColor(status: DutyStatusType): string {
  switch (status) {
    case 'PRESENT': return '#4ade80';
    case 'LIMDU':
    case 'PTAD': return '#fbbf24';
    case 'UA':
    case 'AWOL':
    case 'DESERTER':
    case 'CONFINEMENT': return '#f87171';
    default: return '#94a3b8';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlphaRosterTable({ personnel, onRefresh }: AlphaRosterTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('last_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingMarine, setEditingMarine] = useState<PersonnelRecord | null>(null);

  const handleAdd = () => {
    setEditingMarine(null);
    setShowModal(true);
  };

  const handleEdit = (p: PersonnelRecord) => {
    setEditingMarine(p);
    setShowModal(true);
  };

  const handleDelete = async (p: PersonnelRecord) => {
    if (!window.confirm(`Delete ${p.rank ?? ''} ${p.last_name}, ${p.first_name}? This cannot be undone.`)) return;
    try {
      await deletePersonnel(p.id);
      onRefresh?.();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSaved = () => {
    onRefresh?.();
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let list = personnel;
    if (term) {
      list = list.filter(
        (p) =>
          p.last_name.toLowerCase().includes(term) ||
          p.first_name.toLowerCase().includes(term) ||
          p.edipi.includes(term) ||
          (p.mos ?? '').toLowerCase().includes(term) ||
          (p.rank ?? '').toLowerCase().includes(term) ||
          (p.billet ?? '').toLowerCase().includes(term),
      );
    }
    const sorted = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'last_name': return dir * a.last_name.localeCompare(b.last_name);
        case 'edipi': return dir * a.edipi.localeCompare(b.edipi);
        case 'rank': return dir * rankSort(a.rank, b.rank);
        case 'pay_grade': return dir * (a.pay_grade ?? '').localeCompare(b.pay_grade ?? '');
        case 'mos': return dir * (a.mos ?? '').localeCompare(b.mos ?? '');
        case 'billet': return dir * (a.billet ?? '').localeCompare(b.billet ?? '');
        case 'status': return dir * a.status.localeCompare(b.status);
        case 'duty_status': return dir * a.duty_status.localeCompare(b.duty_status);
        case 'rifle_qual': return dir * (a.rifle_qual ?? '').localeCompare(b.rifle_qual ?? '');
        case 'pft_score': return dir * ((a.pft_score ?? 0) - (b.pft_score ?? 0));
        case 'cft_score': return dir * ((a.cft_score ?? 0) - (b.cft_score ?? 0));
        default: return 0;
      }
    });
    return sorted;
  }, [personnel, search, sortKey, sortDir]);

  const columns: { key: SortKey; label: string; width?: number }[] = [
    { key: 'last_name', label: 'NAME' },
    { key: 'edipi', label: 'EDIPI', width: 100 },
    { key: 'rank', label: 'RANK', width: 70 },
    { key: 'pay_grade', label: 'PAY GRD', width: 65 },
    { key: 'mos', label: 'MOS', width: 55 },
    { key: 'billet', label: 'BILLET' },
    { key: 'status', label: 'STATUS', width: 70 },
    { key: 'duty_status', label: 'DUTY', width: 80 },
    { key: 'rifle_qual', label: 'RIFLE', width: 95 },
    { key: 'pft_score', label: 'PFT', width: 50 },
    { key: 'cft_score', label: 'CFT', width: 50 },
  ];

  const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    padding: '8px 8px',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    padding: '6px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search + Add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, EDIPI, MOS, billet..."
            style={{
              width: '100%',
              padding: '7px 10px 7px 30px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          />
        </div>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '1px',
            color: 'var(--color-accent)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={12} />
          ADD MARINE
        </button>
      </div>

      {/* Count */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--color-text-muted)',
          letterSpacing: '1px',
        }}
      >
        {filtered.length} PERSONNEL
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="NO PERSONNEL"
          message="Personnel assigned to this unit will appear here"
        />
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 900,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    ...headerStyle,
                    width: col.width,
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4, opacity: 0.6 }}>
                      {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
                    </span>
                  )}
                </th>
              ))}
              <th style={{ ...headerStyle, width: 85, cursor: 'default' }}>LOCATION</th>
              <th style={{ ...headerStyle, width: 90, textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                style={{
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <td style={cellStyle}>
                  <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
                    {p.last_name}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>, {p.first_name}</span>
                </td>
                <td style={cellStyle}>{p.edipi}</td>
                <td style={{ ...cellStyle, color: 'var(--color-text-bright)', fontWeight: 600 }}>
                  {p.rank ?? '—'}
                </td>
                <td style={cellStyle}>{p.pay_grade ?? '—'}</td>
                <td style={{ ...cellStyle, color: 'var(--color-accent)' }}>{p.mos ?? '—'}</td>
                <td style={{ ...cellStyle, maxWidth: 160 }}>{p.billet ?? '—'}</td>
                <td style={cellStyle}>{p.status}</td>
                <td style={cellStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 2,
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.5px',
                      color: dutyStatusColor(p.duty_status),
                      backgroundColor: `${dutyStatusColor(p.duty_status)}15`,
                      border: `1px solid ${dutyStatusColor(p.duty_status)}40`,
                    }}
                  >
                    {p.duty_status}
                  </span>
                </td>
                <td style={cellStyle}>
                  <span
                    style={{
                      color: rifleQualColor(p.rifle_qual),
                      fontWeight: 600,
                    }}
                  >
                    {p.rifle_qual ?? '—'}
                  </span>
                </td>
                <td style={{ ...cellStyle, fontWeight: 600, color: (p.pft_score ?? 0) >= 235 ? 'var(--color-text-bright)' : '#f87171' }}>
                  {p.pft_score ?? '—'}
                </td>
                <td style={{ ...cellStyle, fontWeight: 600, color: (p.cft_score ?? 0) >= 235 ? 'var(--color-text-bright)' : '#f87171' }}>
                  {p.cft_score ?? '—'}
                </td>
                <td style={cellStyle}>
                  {p.current_movement_id ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: 2,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        color: '#fb923c',
                        backgroundColor: 'rgba(251, 146, 60, 0.15)',
                        border: '1px solid rgba(251, 146, 60, 0.4)',
                        cursor: 'pointer',
                      }}
                      title={`Movement #${p.current_movement_id}`}
                    >
                      EN ROUTE
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      PRESENT
                    </span>
                  )}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(p)}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        color: 'var(--color-accent)',
                        background: 'none',
                        border: '1px solid var(--color-border)',
                        borderRadius: 2,
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        color: '#f87171',
                        background: 'none',
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 2,
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}
                    >
                      DEL
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <AddEditPersonnelModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        initialData={editingMarine}
      />
    </div>
  );
}
