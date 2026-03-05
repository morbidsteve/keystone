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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Add Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
          ADD BILLET
        </button>
      </div>

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
                <td style={{ ...cellStyle, textAlign: 'center', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleEdit(b)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                        color: 'var(--color-accent)', background: 'none',
                        border: '1px solid var(--color-border)', borderRadius: 2,
                        padding: '2px 5px', cursor: 'pointer', letterSpacing: '0.5px',
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                        color: '#f87171', background: 'none',
                        border: '1px solid rgba(248,113,113,0.3)', borderRadius: 2,
                        padding: '2px 5px', cursor: 'pointer', letterSpacing: '0.5px',
                      }}
                    >
                      DEL
                    </button>
                    {b.is_filled ? (
                      <button
                        onClick={() => handleUnassign(b)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                          color: '#fbbf24', background: 'none',
                          border: '1px solid rgba(251,191,36,0.3)', borderRadius: 2,
                          padding: '2px 5px', cursor: 'pointer', letterSpacing: '0.5px',
                        }}
                      >
                        UNASSIGN
                      </button>
                    ) : (
                      <button
                        onClick={() => { setAssigningBilletId(assigningBilletId === b.id ? null : b.id); setAssignSearch(''); }}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                          color: '#4ade80', background: 'none',
                          border: '1px solid rgba(74,222,128,0.3)', borderRadius: 2,
                          padding: '2px 5px', cursor: 'pointer', letterSpacing: '0.5px',
                        }}
                      >
                        ASSIGN
                      </button>
                    )}
                  </div>
                  {assigningBilletId === b.id && !b.is_filled && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 40,
                        width: 260,
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                    >
                      <input
                        autoFocus
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        placeholder="Search Marine..."
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text)',
                          backgroundColor: 'var(--color-bg)',
                          border: 'none',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      />
                      <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                        {filteredPersonnel.slice(0, 15).map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleAssign(b.id, m)}
                            style={{
                              padding: '5px 8px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              color: 'var(--color-text)',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-hover)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          >
                            <span style={{ color: 'var(--color-text-bright)', fontWeight: 600 }}>
                              {m.rank ?? ''} {m.last_name}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>, {m.first_name}</span>
                            <span style={{ color: 'var(--color-accent)', marginLeft: 6 }}>{m.mos ?? ''}</span>
                          </div>
                        ))}
                        {filteredPersonnel.length === 0 && (
                          <div style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center' }}>
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

      <AddEditBilletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        initialData={editingBillet}
      />
    </div>
  );
}
