// =============================================================================
// AlphaRosterTable — Sortable personnel roster with search/filter
// =============================================================================

import { useState, useMemo } from 'react';
import { Search, Users, Plus } from 'lucide-react';
import type { PersonnelRecord, RifleQual, DutyStatusType } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import StatusDot from '@/components/ui/StatusDot';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AddEditPersonnelModal from './AddEditPersonnelModal';
import { deletePersonnel } from '@/api/personnel';
import { useToast } from '@/hooks/useToast';
import ExportMenu from '@/components/common/ExportMenu';
import TablePagination from '@/components/ui/TablePagination';

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

const DUTY_STATUS_OPTIONS: Array<{ value: DutyStatusType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'ALL' },
  { value: 'PRESENT', label: 'PRESENT' },
  { value: 'LIMDU', label: 'LIMDU' },
  { value: 'PTAD', label: 'PTAD' },
  { value: 'UA', label: 'UA' },
  { value: 'AWOL', label: 'AWOL' },
  { value: 'DESERTER', label: 'DESERTER' },
  { value: 'CONFINEMENT', label: 'CONFINEMENT' },
];

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
  const [dutyStatusFilter, setDutyStatusFilter] = useState<DutyStatusType | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('last_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingMarine, setEditingMarine] = useState<PersonnelRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deleteTarget, setDeleteTarget] = useState<PersonnelRecord | null>(null);
  const toast = useToast();

  const handleAdd = () => {
    setEditingMarine(null);
    setShowModal(true);
  };

  const handleEdit = (p: PersonnelRecord) => {
    setEditingMarine(p);
    setShowModal(true);
  };

  const handleDeleteRequest = (p: PersonnelRecord) => {
    setDeleteTarget(p);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deletePersonnel(deleteTarget.id);
      toast.success(`${deleteTarget.rank ?? ''} ${deleteTarget.last_name} removed from roster`);
      onRefresh?.();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.danger('Failed to delete personnel record');
    }
    setDeleteTarget(null);
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

    // Text search
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

    // Duty status filter
    if (dutyStatusFilter !== 'ALL') {
      list = list.filter((p) => p.duty_status === dutyStatusFilter);
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
  }, [personnel, search, dutyStatusFilter, sortKey, sortDir]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, dutyStatusFilter]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const exportData = useMemo(
    () =>
      filtered.map((p) => ({
        last_name: p.last_name,
        first_name: p.first_name,
        edipi: p.edipi,
        rank: p.rank ?? '',
        pay_grade: p.pay_grade ?? '',
        mos: p.mos ?? '',
        billet: p.billet ?? '',
        status: p.status,
        duty_status: p.duty_status,
        rifle_qual: p.rifle_qual ?? '',
        pft_score: p.pft_score ?? '',
        cft_score: p.cft_score ?? '',
      })) as Record<string, unknown>[],
    [filtered],
  );

  const exportColumns = [
    { key: 'last_name', header: 'Last Name' },
    { key: 'first_name', header: 'First Name' },
    { key: 'edipi', header: 'EDIPI' },
    { key: 'rank', header: 'Rank' },
    { key: 'pay_grade', header: 'Pay Grade' },
    { key: 'mos', header: 'MOS' },
    { key: 'billet', header: 'Billet' },
    { key: 'status', header: 'Status' },
    { key: 'duty_status', header: 'Duty Status' },
    { key: 'rifle_qual', header: 'Rifle Qual' },
    { key: 'pft_score', header: 'PFT' },
    { key: 'cft_score', header: 'CFT' },
  ];

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
    <div className="flex flex-col gap-3">
      {/* Search + Status Filter + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-[320px] flex-1">
          <Search
            size={14}
            className="absolute left-2.5 text-[var(--color-text-muted)]" style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, EDIPI, rank, MOS, billet..."
            className="w-full font-[var(--font-mono)] text-[11px] text-[var(--color-text)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]" style={{ padding: '7px 10px 7px 30px' }}
          />
        </div>
        <div>
          <label
            className="font-[var(--font-mono)] text-[9px] uppercase tracking-[1.5px] text-[var(--color-text-muted)] block mb-1"
          >
            DUTY STATUS
          </label>
          <select
            value={dutyStatusFilter}
            onChange={(e) => setDutyStatusFilter(e.target.value as DutyStatusType | 'ALL')}
            className="py-1.5 px-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text)] font-[var(--font-mono)] text-[11px]"
          >
            {DUTY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 py-1.5 px-3 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] text-[var(--color-accent)] bg-transparent border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer whitespace-nowrap"
        >
          <Plus size={12} />
          ADD MARINE
        </button>
        <ExportMenu
          data={exportData}
          filename="alpha-roster"
          title="Alpha Roster"
          columns={exportColumns}
        />
      </div>

      {/* Count */}
      <div
        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[1px]"
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
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
        <div style={{ overflow: 'auto' }}>
          <table
            className="w-full border-collapse min-w-[900px]"
          >
            <thead className="sticky top-0 z-10 bg-[var(--color-bg-elevated)]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...headerStyle,
                      width: col.width,
                      textAlign: ['pft_score', 'cft_score'].includes(col.key) ? 'right' : 'left',
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1 opacity-60">
                        {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
                      </span>
                    )}
                  </th>
                ))}
                <th className="cursor-default">LOCATION</th>
                <th className="text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((p) => (
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
                    <span className="text-[var(--color-text-bright)] font-semibold">
                      {p.last_name}
                    </span>
                    <span className="text-[var(--color-text-muted)]">, {p.first_name}</span>
                  </td>
                  <td style={cellStyle}>{p.edipi}</td>
                  <td className="font-semibold">
                    {p.rank ?? '—'}
                  </td>
                  <td style={cellStyle}>{p.pay_grade ?? '—'}</td>
                  <td style={{ ...cellStyle, color: 'var(--color-accent)' }}>{p.mos ?? '—'}</td>
                  <td style={{ ...cellStyle, maxWidth: 160 }}>{p.billet ?? '—'}</td>
                  <td style={cellStyle}>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={p.status} />
                      <span style={{ color: getStatusColor(p.status) }}>{p.status}</span>
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <span
                      className="inline-block py-px px-1.5 rounded-[2px] text-[9px] font-semibold font-[var(--font-mono)] tracking-[0.5px]" style={{ color: dutyStatusColor(p.duty_status), backgroundColor: `${dutyStatusColor(p.duty_status)}15`, border: `1px solid ${dutyStatusColor(p.duty_status)}40` }}
                    >
                      {p.duty_status}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span
                      className="font-semibold" style={{ color: rifleQualColor(p.rifle_qual) }}
                    >
                      {p.rifle_qual ?? '—'}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600, textAlign: 'right', color: (p.pft_score ?? 0) >= 235 ? 'var(--color-text-bright)' : '#f87171' }}>
                    {p.pft_score ?? '—'}
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600, textAlign: 'right', color: (p.cft_score ?? 0) >= 235 ? 'var(--color-text-bright)' : '#f87171' }}>
                    {p.cft_score ?? '—'}
                  </td>
                  <td style={cellStyle}>
                    {p.current_movement_id ? (
                      <span
                        className="inline-block py-px px-1.5 rounded-[2px] font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[#fb923c] bg-[rgba(251,146,60,0.15)] cursor-pointer" style={{ border: '1px solid rgba(251, 146, 60, 0.4)' }}
                        title={`Movement #${p.current_movement_id}`}
                      >
                        EN ROUTE
                      </span>
                    ) : (
                      <span
                        className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                      >
                        PRESENT
                      </span>
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => handleEdit(p)}
                        className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[var(--color-accent)] bg-transparent border border-[var(--color-border)] rounded-[2px] py-0.5 px-1.5 cursor-pointer"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(p)}
                        className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[0.5px] text-[#f87171] bg-transparent rounded-[2px] py-0.5 px-1.5 cursor-pointer border border-[rgba(248,113,113,0.3)]"
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

        {/* Pagination */}
        <div className="border-t border-t-[var(--color-border)]">
          <TablePagination
            totalItems={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      </div>
      )}

      <AddEditPersonnelModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        initialData={editingMarine}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="DELETE PERSONNEL"
        message={deleteTarget ? `Delete ${deleteTarget.rank ?? ''} ${deleteTarget.last_name}, ${deleteTarget.first_name}? This action cannot be undone.` : ''}
        confirmLabel="DELETE"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
