// =============================================================================
// CustodyPage — Sensitive Item Chain of Custody Management
// =============================================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  ShieldAlert,
  Package,
  ClipboardCheck,
  AlertTriangle,
  History,
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import SensitiveItemsTable from '@/components/custody/SensitiveItemsTable';
import CustodyChainTimeline from '@/components/custody/CustodyChainTimeline';
import InventoryPanel from '@/components/custody/InventoryPanel';
import {
  getSensitiveItems,
  getCustodyChain,
  getTransfers,
  getInventoryEvents,
} from '@/api/custody';
import type { SensitiveItemType, TransferType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'registry' as const, label: 'ITEM REGISTRY' },
  { key: 'transfers' as const, label: 'CUSTODY TRANSFERS' },
  { key: 'inventory' as const, label: 'INVENTORY' },
  { key: 'missing' as const, label: 'MISSING ITEMS' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Transfer type labels
// ---------------------------------------------------------------------------

const TRANSFER_TYPE_LABELS: Record<string, string> = {
  ISSUE: 'Issue',
  TURN_IN: 'Turn-In',
  LATERAL_TRANSFER: 'Lateral Transfer',
  TEMPORARY_LOAN: 'Temporary Loan',
  MAINTENANCE_TURN_IN: 'Maintenance Turn-In',
  MAINTENANCE_RETURN: 'Maintenance Return',
  INVENTORY_ADJUSTMENT: 'Inventory Adjustment',
};

const TRANSFER_TYPE_COLORS: Record<string, string> = {
  ISSUE: '#22c55e',
  TURN_IN: '#6b7280',
  LATERAL_TRANSFER: '#8b5cf6',
  TEMPORARY_LOAN: '#f59e0b',
  MAINTENANCE_TURN_IN: '#6366f1',
  MAINTENANCE_RETURN: '#14b8a6',
  INVENTORY_ADJUSTMENT: '#ef4444',
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CustodyPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('registry');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  // New transfer form
  const [showNewTransferForm, setShowNewTransferForm] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    sensitive_item_id: '',
    to_personnel_name: '',
    transfer_type: 'ISSUE' as TransferType,
    document_number: '',
    reason: '',
  });

  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 4;
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 4 : parsed;
  }, [selectedUnitId]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['custody-items', numericUnitId],
    queryFn: () => getSensitiveItems(numericUnitId),
  });

  const { data: custodyChain, isLoading: chainLoading } = useQuery({
    queryKey: ['custody-chain', selectedItemId],
    queryFn: () => getCustodyChain(selectedItemId!),
    enabled: selectedItemId !== null,
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['custody-transfers', numericUnitId],
    queryFn: () => getTransfers(numericUnitId),
    enabled: activeTab === 'transfers',
  });

  const { data: inventoryEvents, isLoading: inventoryLoading } = useQuery({
    queryKey: ['custody-inventory', numericUnitId],
    queryFn: () => getInventoryEvents(numericUnitId),
    enabled: activeTab === 'inventory',
  });

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let result = [...items];
    if (filterType !== 'ALL') {
      result = result.filter((i) => i.item_type === filterType);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.serial_number.toLowerCase().includes(term) ||
          i.nomenclature.toLowerCase().includes(term) ||
          (i.current_holder_name ?? '').toLowerCase().includes(term),
      );
    }
    return result;
  }, [items, filterType, searchTerm]);

  const missingItems = useMemo(() => {
    if (!items) return [];
    return items.filter((i) => i.status === 'MISSING');
  }, [items]);

  const selectedItem = useMemo(() => {
    if (!items || !selectedItemId) return null;
    return items.find((i) => i.id === selectedItemId) ?? null;
  }, [items, selectedItemId]);

  const onHandCount = items?.filter((i) => i.status === 'ON_HAND').length ?? 0;
  const missingCount = missingItems.length;
  const lastInventoryDate = items
    ?.filter((i) => i.last_inventory_date)
    .sort(
      (a, b) =>
        new Date(b.last_inventory_date!).getTime() -
        new Date(a.last_inventory_date!).getTime(),
    )[0]?.last_inventory_date;

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderLoadingSkeleton = () => (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div
        className="skeleton"
        style={{ width: 200, height: 16, margin: '0 auto 12px' }}
      />
      <div
        className="skeleton"
        style={{ width: 300, height: 12, margin: '0 auto' }}
      />
    </div>
  );

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    padding: '6px 10px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--color-text)',
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1px',
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  // -------------------------------------------------------------------------
  // Registry tab content
  // -------------------------------------------------------------------------

  const renderRegistry = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
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
              placeholder="Serial, nomenclature, holder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 26, width: 240 }}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>ITEM TYPE</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={selectStyle}
          >
            <option value="ALL">All Types</option>
            {(['WEAPON', 'OPTIC', 'NVG', 'CRYPTO', 'RADIO', 'COMSEC', 'CLASSIFIED_DOCUMENT', 'EXPLOSIVE', 'MISSILE', 'OTHER'] as SensitiveItemType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* Table + Detail split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedItemId ? '1fr 380px' : '1fr',
          gap: 16,
        }}
      >
        <Card title="SENSITIVE ITEMS REGISTRY">
          <SensitiveItemsTable
            items={filteredItems}
            onSelectItem={setSelectedItemId}
            loading={itemsLoading}
          />
        </Card>

        {selectedItemId && selectedItem && (
          <Card
            title="CUSTODY CHAIN"
            accentColor="#3b82f6"
            headerRight={
              <button
                onClick={() => setSelectedItemId(null)}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted)',
                  padding: '2px 6px',
                  fontSize: 9,
                }}
              >
                CLOSE
              </button>
            }
          >
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-text-bright)',
                  marginBottom: 2,
                }}
              >
                {selectedItem.nomenclature}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                }}
              >
                S/N: {selectedItem.serial_number}
              </div>
            </div>
            {chainLoading ? (
              renderLoadingSkeleton()
            ) : (
              <CustodyChainTimeline
                transfers={custodyChain ?? []}
                currentHolderName={selectedItem.current_holder_name}
              />
            )}
          </Card>
        )}
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Transfers tab content
  // -------------------------------------------------------------------------

  const renderTransfers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowNewTransferForm(!showNewTransferForm)}
          style={{
            ...buttonStyle,
            backgroundColor: 'var(--color-accent)',
            color: '#000',
          }}
        >
          <Plus size={12} />
          {showNewTransferForm ? 'CANCEL' : 'NEW TRANSFER'}
        </button>
      </div>

      {/* New transfer form */}
      {showNewTransferForm && (
        <Card title="CREATE TRANSFER" accentColor="var(--color-accent)">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={labelStyle}>ITEM (SERIAL #)</label>
              <select
                value={newTransfer.sensitive_item_id}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, sensitive_item_id: e.target.value })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="">Select item...</option>
                {(items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.serial_number} — {item.nomenclature}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>TRANSFER TO</label>
              <input
                type="text"
                placeholder="Personnel name"
                value={newTransfer.to_personnel_name}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, to_personnel_name: e.target.value })
                }
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>TRANSFER TYPE</label>
              <select
                value={newTransfer.transfer_type}
                onChange={(e) =>
                  setNewTransfer({
                    ...newTransfer,
                    transfer_type: e.target.value as TransferType,
                  })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                {Object.entries(TRANSFER_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>DOCUMENT NUMBER</label>
              <input
                type="text"
                placeholder="HR-2026-XXXX"
                value={newTransfer.document_number}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, document_number: e.target.value })
                }
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>REASON</label>
              <input
                type="text"
                placeholder="Reason for transfer"
                value={newTransfer.reason}
                onChange={(e) =>
                  setNewTransfer({ ...newTransfer, reason: e.target.value })
                }
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <button
                style={{
                  ...buttonStyle,
                  backgroundColor: 'var(--color-accent)',
                  color: '#000',
                  marginTop: 8,
                }}
              >
                <Plus size={12} />
                SUBMIT TRANSFER
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent transfers table */}
      <Card title="RECENT TRANSFERS">
        {transfersLoading ? (
          renderLoadingSkeleton()
        ) : !transfers || transfers.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            No transfers found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Item', 'From', 'To', 'Type', 'Document #', 'Reason'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-muted)',
                        padding: '8px 10px',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => {
                  const typeColor =
                    TRANSFER_TYPE_COLORS[transfer.transfer_type] ?? '#6b7280';
                  const matchItem = items?.find(
                    (i) => i.id === transfer.sensitive_item_id,
                  );

                  return (
                    <tr key={transfer.id}>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(transfer.transfer_date).toLocaleDateString()}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-text-bright)',
                          fontWeight: 600,
                        }}
                      >
                        {matchItem?.serial_number ?? `Item #${transfer.sensitive_item_id}`}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {transfer.from_personnel_name ?? '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ChevronRight
                            size={10}
                            style={{ color: 'var(--color-text-muted)' }}
                          />
                          {transfer.to_personnel_name ?? '—'}
                        </div>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 3,
                            backgroundColor: `${typeColor}20`,
                            color: typeColor,
                            fontWeight: 600,
                            fontSize: 9,
                          }}
                        >
                          {transfer.transfer_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {transfer.document_number ?? '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          color: 'var(--color-text-muted)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {transfer.reason ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Inventory tab content
  // -------------------------------------------------------------------------

  const renderInventory = () => (
    <Card title="INVENTORY EVENTS">
      <InventoryPanel events={inventoryEvents ?? []} loading={inventoryLoading} />
    </Card>
  );

  // -------------------------------------------------------------------------
  // Missing Items tab content
  // -------------------------------------------------------------------------

  const renderMissing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {missingCount > 0 && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: '#ef4444',
                marginBottom: 2,
              }}
            >
              {missingCount} SENSITIVE ITEM{missingCount !== 1 ? 'S' : ''} MISSING
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#f87171',
              }}
            >
              Immediate action required. Notify chain of command and initiate FLIPL procedures.
            </div>
          </div>
        </div>
      )}

      <Card title="MISSING ITEMS" accentColor="#ef4444">
        <SensitiveItemsTable
          items={missingItems}
          onSelectItem={setSelectedItemId}
          loading={itemsLoading}
        />
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 0 }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={18} style={{ color: 'var(--color-accent)' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-bright)',
              letterSpacing: '1px',
            }}
          >
            CHAIN OF CUSTODY
          </span>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {[
          {
            label: 'TOTAL ITEMS',
            value: items ? items.length.toString() : '—',
            color: 'var(--color-text-bright)',
            icon: Package,
          },
          {
            label: 'ON HAND',
            value: items ? onHandCount.toString() : '—',
            color: '#22c55e',
            icon: Shield,
          },
          {
            label: 'MISSING',
            value: items ? missingCount.toString() : '—',
            color: missingCount > 0 ? '#ef4444' : '#22c55e',
            icon: ShieldAlert,
          },
          {
            label: 'LAST INVENTORY',
            value: lastInventoryDate
              ? new Date(lastInventoryDate).toLocaleDateString()
              : '—',
            color: '#3b82f6',
            icon: ClipboardCheck,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <kpi.icon size={11} style={{ color: 'var(--color-text-muted)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {kpi.label}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 700,
                color: kpi.color,
              }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Missing items alert */}
      {missingCount > 0 && activeTab !== 'missing' && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={12} style={{ color: '#ef4444' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              color: '#ef4444',
              letterSpacing: '1px',
            }}
          >
            {missingCount} MISSING ITEM{missingCount !== 1 ? 'S' : ''} — IMMEDIATE ACTION REQUIRED
          </span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: activeTab === tab.key ? 600 : 400,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.key === 'missing' && missingCount > 0 && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'inline-block',
                }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'registry' && renderRegistry()}
      {activeTab === 'transfers' && renderTransfers()}
      {activeTab === 'inventory' && renderInventory()}
      {activeTab === 'missing' && renderMissing()}
    </div>
  );
}
