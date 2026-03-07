// =============================================================================
// CatalogManager — Admin UI for managing the sensitive item catalog
// =============================================================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit3, Trash2, X, Check, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  getCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  type SensitiveItemCatalogItem,
  type SensitiveItemCatalogItemCreate,
} from '@/api/sensitiveItemCatalog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_TYPES = [
  'WEAPON',
  'OPTIC',
  'NVG',
  'CRYPTO',
  'RADIO',
  'COMSEC',
  'CLASSIFIED_DOCUMENT',
  'EXPLOSIVE',
  'MISSILE',
  'OTHER',
];

const ITEM_TYPE_COLORS: Record<string, string> = {
  WEAPON: '#ef4444',
  OPTIC: '#3b82f6',
  NVG: '#22c55e',
  CRYPTO: '#f59e0b',
  RADIO: '#8b5cf6',
  COMSEC: '#f97316',
  CLASSIFIED_DOCUMENT: '#ec4899',
  EXPLOSIVE: '#dc2626',
  MISSILE: '#b91c1c',
  OTHER: '#6b7280',
};

// ---------------------------------------------------------------------------
// Shared styles (matching AdminPage patterns)
// ---------------------------------------------------------------------------

const tableHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-border)',
  whiteSpace: 'nowrap',
};

const tableCellStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '8px 12px',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  cursor: 'pointer',
};

const addButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  backgroundColor: 'var(--color-accent)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: 'var(--color-bg)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  cursor: 'pointer',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(2px)',
};

const modalBoxStyle: React.CSSProperties = {
  width: 500,
  maxHeight: '80vh',
  overflowY: 'auto',
  backgroundColor: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
  fontFamily: 'var(--font-mono)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '2px',
  color: 'var(--color-text-bright)',
  textTransform: 'uppercase',
};

const closeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  borderRadius: 'var(--radius)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
};

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  nomenclature: '',
  nsn: '',
  item_type: 'WEAPON',
  tamcn: '',
  aliases: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CatalogManager() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SensitiveItemCatalogItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<SensitiveItemCatalogItem | null>(null);

  // ── Data fetching ──

  const { data: catalogItems, isLoading } = useQuery({
    queryKey: ['sensitive-item-catalog', searchTerm, filterType],
    queryFn: () =>
      getCatalogItems({
        q: searchTerm || undefined,
        item_type: filterType !== 'ALL' ? filterType : undefined,
      }),
  });

  // ── Mutations ──

  const createMutation = useMutation({
    mutationFn: createCatalogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitive-item-catalog'] });
      toast.success('Catalog item created successfully');
      setModalOpen(false);
    },
    onError: () => toast.danger('Failed to create catalog item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SensitiveItemCatalogItemCreate> }) =>
      updateCatalogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitive-item-catalog'] });
      toast.success('Catalog item updated successfully');
      setModalOpen(false);
    },
    onError: () => toast.danger('Failed to update catalog item'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCatalogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitive-item-catalog'] });
      toast.success('Catalog item deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.danger('Failed to delete catalog item'),
  });

  // ── Handlers ──

  const openAddModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (item: SensitiveItemCatalogItem) => {
    setEditingItem(item);
    setForm({
      nomenclature: item.nomenclature,
      nsn: item.nsn ?? '',
      item_type: item.item_type,
      tamcn: item.tamcn ?? '',
      aliases: item.aliases.join(', '),
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nomenclature.trim()) return;

    const payload: SensitiveItemCatalogItemCreate = {
      nomenclature: form.nomenclature.trim(),
      item_type: form.item_type,
      nsn: form.nsn.trim() || undefined,
      tamcn: form.tamcn.trim() || undefined,
      aliases: form.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  // ── Derived data ──

  const items = catalogItems ?? [];
  const itemCount = items.length;

  return (
    <>
      <Card
        title="SENSITIVE ITEM CATALOG"
        headerRight={
          <button onClick={openAddModal} style={addButtonStyle}>
            <Plus size={10} /> ADD ITEM
          </button>
        }
      >
        {/* Filter bar */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle}>SEARCH</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Nomenclature, NSN, alias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, width: 260, paddingLeft: 28 }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>ITEM TYPE</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ ...selectStyle, width: 160 }}
            >
              <option value="ALL">All Types</option>
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--color-text-muted)',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              paddingBottom: 6,
            }}
          >
            <Package size={10} />
            {itemCount} ITEM{itemCount !== 1 ? 'S' : ''}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}
          >
            Loading catalog...
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}
          >
            No catalog items found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>NOMENCLATURE</th>
                  <th style={tableHeaderStyle}>NSN</th>
                  <th style={tableHeaderStyle}>TYPE</th>
                  <th style={tableHeaderStyle}>TAMCN</th>
                  <th style={tableHeaderStyle}>ALIASES</th>
                  <th style={tableHeaderStyle}>ACTIVE</th>
                  <th style={tableHeaderStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const typeColor = ITEM_TYPE_COLORS[item.item_type] ?? '#6b7280';
                  return (
                    <tr
                      key={item.id}
                      style={{ transition: 'background-color var(--transition)' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'var(--color-bg-hover)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <td
                        style={{
                          ...tableCellStyle,
                          color: 'var(--color-text-bright)',
                          fontWeight: 600,
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.nomenclature}
                      >
                        {item.nomenclature}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          color: 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.nsn ?? '--'}
                      </td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            letterSpacing: '1px',
                            padding: '2px 6px',
                            borderRadius: 3,
                            backgroundColor: `${typeColor}20`,
                            color: typeColor,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.item_type}
                        </span>
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {item.tamcn ?? '--'}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          color: 'var(--color-text-muted)',
                          fontSize: 10,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.aliases.join(', ')}
                      >
                        {item.aliases.length > 0 ? item.aliases.join(', ') : '--'}
                      </td>
                      <td style={tableCellStyle}>
                        {item.is_active ? (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#22c55e',
                            }}
                            title="Active"
                          />
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#ef4444',
                            }}
                            title="Inactive"
                          />
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => openEditModal(item)}
                            style={actionBtnStyle}
                          >
                            <Edit3 size={9} /> EDIT
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            style={{
                              ...actionBtnStyle,
                              color: 'var(--color-danger)',
                              borderColor: 'rgba(255,107,107,0.3)',
                            }}
                          >
                            <Trash2 size={9} /> DELETE
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div style={modalBoxStyle}>
            <div style={modalHeaderStyle}>
              <span style={modalTitleStyle}>
                {editingItem ? 'EDIT CATALOG ITEM' : 'ADD CATALOG ITEM'}
              </span>
              <button onClick={() => setModalOpen(false)} style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <label style={labelStyle}>NOMENCLATURE *</label>
                <input
                  type="text"
                  value={form.nomenclature}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nomenclature: e.target.value }))
                  }
                  placeholder="e.g. Rifle, 5.56mm, M4A1"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>ITEM TYPE *</label>
                  <select
                    value={form.item_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, item_type: e.target.value }))
                    }
                    style={selectStyle}
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>NSN</label>
                  <input
                    type="text"
                    value={form.nsn}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nsn: e.target.value }))
                    }
                    placeholder="e.g. 1005-01-231-0973"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>TAMCN</label>
                <input
                  type="text"
                  value={form.tamcn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tamcn: e.target.value }))
                  }
                  placeholder="e.g. D28"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>ALIASES (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  value={form.aliases}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, aliases: e.target.value }))
                  }
                  placeholder="e.g. M4A1, M4, Carbine"
                  style={inputStyle}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    marginTop: 4,
                    letterSpacing: '0.5px',
                    margin: '4px 0 0 0',
                  }}
                >
                  Short names used for search matching in the custody registration form.
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                  paddingTop: 8,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '6px 16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    !form.nomenclature.trim() ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                  style={{
                    padding: '6px 16px',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'rgba(77,171,247,0.15)',
                    color: 'var(--color-accent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: form.nomenclature.trim() ? 'pointer' : 'not-allowed',
                    opacity: form.nomenclature.trim() ? 1 : 0.5,
                  }}
                >
                  {editingItem ? 'SAVE CHANGES' : 'CREATE ITEM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="DELETE CATALOG ITEM"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.nomenclature}" from the catalog? This cannot be undone.`
            : ''
        }
        confirmLabel="DELETE"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
