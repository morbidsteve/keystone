// =============================================================================
// BilletTracker — Billet management view with vacancy tracking
// =============================================================================

import { useState, useMemo } from 'react';
import { Star, Plus } from 'lucide-react';
import type { BilletRecord, PersonnelRecord } from '@/lib/types';
import AddEditBilletModal from './AddEditBilletModal';
import { deleteBillet, updateBillet } from '@/api/personnel';

interface BilletTrackerProps {
  billets: BilletRecord[];
  onRefresh?: () => void;
  personnel?: PersonnelRecord[];
}

export default function BilletTracker({ billets, onRefresh, personnel }: BilletTrackerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingBillet, setEditingBillet] = useState<BilletRecord | null>(null);
  const [assigningBilletId, setAssigningBilletId] = useState<number | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  const handleAdd = () => {
    setEditingBillet(null);
    setShowModal(true);
  };

  const handleEdit = (b: BilletRecord) => {
    setEditingBillet(b);
    setShowModal(true);
  };

  const handleDelete = async (b: BilletRecord) => {
    if (!window.confirm(`Delete billet "${b.billet_title}" (${b.billet_id_code})? This cannot be undone.`)) return;
    try {
      await deleteBillet(b.id);
      onRefresh?.();
    } catch (err) {
      console.error('Delete billet failed:', err);
    }
  };

  const handleAssign = async (billetId: number, marine: PersonnelRecord) => {
    try {
      await updateBillet(billetId, {
        is_filled: true,
        filled_by_id: marine.id,
        filled_by_name: `${marine.rank ?? ''} ${marine.last_name}`.trim(),
        filled_date: new Date().toISOString().split('T')[0],
      });
      setAssigningBilletId(null);
      setAssignSearch('');
      onRefresh?.();
    } catch (err) {
      console.error('Assign failed:', err);
    }
  };

  const handleUnassign = async (b: BilletRecord) => {
    try {
      await updateBillet(b.id, {
        is_filled: false,
        filled_by_id: null,
        filled_by_name: undefined,
        filled_date: null,
      });
      onRefresh?.();
    } catch (err) {
      console.error('Unassign failed:', err);
    }
  };

  const handleSaved = () => {
    onRefresh?.();
  };

  const filteredPersonnel = useMemo(() => {
    if (!personnel || !assignSearch) return personnel ?? [];
    const term = assignSearch.toLowerCase();
    return personnel.filter(
      (p) =>
        p.last_name.toLowerCase().includes(term) ||
        p.first_name.toLowerCase().includes(term) ||
        (p.rank ?? '').toLowerCase().includes(term) ||
        (p.mos ?? '').toLowerCase().includes(term),
    );
  }, [personnel, assignSearch]);
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
    <div className="flex flex-col gap-5">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 py-1.5 px-3 font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px] text-[var(--color-accent)] bg-transparent border border-[var(--color-accent)] rounded-[var(--radius)] cursor-pointer whitespace-nowrap"
        >
          <Plus size={12} />
          ADD BILLET
        </button>
      </div>

      {/* Summary KPIs */}
      <div
        className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]"
      >
        {[
          { label: 'TOTAL BILLETS', value: stats.total, color: 'var(--color-text-bright)' },
          { label: 'FILLED', value: stats.filled, color: '#4ade80' },
          { label: 'VACANT', value: stats.vacant, color: stats.vacant > 0 ? '#f87171' : '#4ade80' },
          { label: 'KEY VACANCIES', value: stats.keyVacancies.length, color: stats.keyVacancies.length > 0 ? '#f87171' : '#4ade80' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="py-3 px-3.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase mb-1"
            >
              {kpi.label}
            </div>
            <div
              className="font-[var(--font-mono)] text-xl font-bold" style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Billet Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th style={headerStyle}>BILLET CODE</th>
              <th style={headerStyle}>TITLE</th>
              <th style={headerStyle}>MOS REQ</th>
              <th style={headerStyle}>RANK REQ</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>KEY?</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>FILLED?</th>
              <th style={headerStyle}>ASSIGNED TO</th>
              <th style={{ ...headerStyle, textAlign: 'center' }}>ACTIONS</th>
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
                <td className="font-semibold">
                  {b.billet_id_code}
                </td>
                <td className="font-semibold">
                  {b.billet_title}
                </td>
                <td style={cellStyle}>{b.mos_required ?? '—'}</td>
                <td style={cellStyle}>{b.rank_required ?? '—'}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  {b.is_key_billet && (
                    <Star size={13} className="text-[#fbbf24]" />
                  )}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span
                    className="inline-block w-[8px] h-[8px]" style={{ borderRadius: '50%', backgroundColor: b.is_filled ? '#4ade80' : '#f87171' }}
                  />
                </td>
                <td style={cellStyle}>
                  {b.filled_by_name ?? (
                    <span className="text-[#f87171] text-[10px] italic">
                      VACANT
                    </span>
                  )}
                </td>
                <td className="relative">
                  <div className="flex gap-1 justify-center flex-wrap">
                    <button
                      onClick={() => handleEdit(b)}
                      className="font-[var(--font-mono)] text-[9px] font-semibold text-[var(--color-accent)] bg-transparent border border-[var(--color-border)] rounded-[2px] py-0.5 px-1.5 cursor-pointer tracking-[0.5px]"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      className="font-[var(--font-mono)] text-[9px] font-semibold text-[#f87171] bg-transparent rounded-[2px] py-0.5 px-1.5 cursor-pointer tracking-[0.5px] border border-[rgba(248,113,113,0.3)]"
                    >
                      DEL
                    </button>
                    {b.is_filled ? (
                      <button
                        onClick={() => handleUnassign(b)}
                        className="font-[var(--font-mono)] text-[9px] font-semibold text-[#fbbf24] bg-transparent rounded-[2px] py-0.5 px-1.5 cursor-pointer tracking-[0.5px]" style={{ border: '1px solid rgba(251,191,36,0.3)' }}
                      >
                        UNASSIGN
                      </button>
                    ) : (
                      <button
                        onClick={() => { setAssigningBilletId(assigningBilletId === b.id ? null : b.id); setAssignSearch(''); }}
                        className="font-[var(--font-mono)] text-[9px] font-semibold text-[#4ade80] bg-transparent rounded-[2px] py-0.5 px-1.5 cursor-pointer tracking-[0.5px]" style={{ border: '1px solid rgba(74,222,128,0.3)' }}
                      >
                        ASSIGN
                      </button>
                    )}
                  </div>
                  {assigningBilletId === b.id && !b.is_filled && (
                    <div
                      className="absolute right-0 z-[40] w-[260px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]" style={{ top: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                    >
                      <input
                        autoFocus
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        placeholder="Search Marine..."
                        className="w-full py-1.5 px-2 font-[var(--font-mono)] text-[10px] text-[var(--color-text)] bg-[var(--color-bg)] border-0 border-b border-b-[var(--color-border)]"
                      />
                      <div className="max-h-[160px] overflow-y-auto">
                        {filteredPersonnel.slice(0, 15).map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleAssign(b.id, m)}
                            className="py-1.5 px-2 font-[var(--font-mono)] text-[10px] text-[var(--color-text)] cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          >
                            <span className="text-[var(--color-text-bright)] font-semibold">
                              {m.rank ?? ''} {m.last_name}
                            </span>
                            <span className="text-[var(--color-text-muted)]">, {m.first_name}</span>
                            <span className="text-[var(--color-accent)] ml-1.5">{m.mos ?? ''}</span>
                          </div>
                        ))}
                        {filteredPersonnel.length === 0 && (
                          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] text-center p-2">
                            NO MATCHES
                          </div>
                        )}
                      </div>
                    </div>
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
            className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[#f87171] uppercase mb-3"
          >
            KEY BILLET VACANCIES
          </div>
          <div
            className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]"
          >
            {stats.keyVacancies.map((b) => (
              <div
                key={b.id}
                className="py-3 px-3.5 bg-[var(--color-bg)] rounded-[var(--radius)] flex flex-col gap-1.5" style={{ border: '1px solid rgba(248, 113, 113, 0.3)', borderLeft: '3px solid #f87171' }}
              >
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-[#fbbf24]" />
                  <span
                    className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-text-bright)]"
                  >
                    {b.billet_title}
                  </span>
                </div>
                <div
                  className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] flex gap-3"
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

      <AddEditBilletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        initialData={editingBillet}
      />
    </div>
  );
}
