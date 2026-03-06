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
import { useToast } from '@/hooks/useToast';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
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
  const toast = useToast();

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
    <div className="p-10 text-center">
      <div
        className="skeleton w-[200px] h-[16px] mx-auto mb-3"
      />
      <div
        className="skeleton w-[300px] h-[12px] mx-auto"
        
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
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <label style={labelStyle}>SEARCH</label>
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2 text-[var(--color-text-muted)]" style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Serial, nomenclature, holder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px]"
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
        className="grid gap-4" style={{ gridTemplateColumns: selectedItemId ? '1fr 380px' : '1fr' }}
      >
        <Card title="SENSITIVE ITEMS REGISTRY">
          {!itemsLoading && filteredItems.length === 0 ? (
            <EmptyState
              icon={<Shield size={32} />}
              title="No custody items registered"
              message="Sensitive items assigned to this unit will appear here"
              actionLabel="REGISTER ITEM"
              onAction={() => setActiveTab('transfers')}
            />
          ) : (
            <SensitiveItemsTable
              items={filteredItems}
              onSelectItem={setSelectedItemId}
              loading={itemsLoading}
            />
          )}
        </Card>

        {selectedItemId && selectedItem && (
          <Card
            title="CUSTODY CHAIN"
            accentColor="#3b82f6"
            headerRight={
              <button
                onClick={() => setSelectedItemId(null)}
                className="text-[var(--color-text-muted)] py-0.5 px-1.5 text-[9px]"
              >
                CLOSE
              </button>
            }
          >
            <div className="mb-3">
              <div
                className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-text-bright)] mb-0.5"
              >
                {selectedItem.nomenclature}
              </div>
              <div
                className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]"
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNewTransferForm(!showNewTransferForm)}
          className="text-[#000]"
        >
          <Plus size={12} />
          {showNewTransferForm ? 'CANCEL' : 'NEW TRANSFER'}
        </button>
      </div>

      {/* New transfer form */}
      {showNewTransferForm && (
        <Card title="CREATE TRANSFER" accentColor="var(--color-accent)">
          <div
            className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
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
            <div className="col-span-full">
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
                className="text-[#000] mt-2"
                onClick={() => {
                  toast.success('Custody transfer submitted successfully');
                  setShowNewTransferForm(false);
                  setNewTransfer({
                    sensitive_item_id: '',
                    to_personnel_name: '',
                    transfer_type: 'ISSUE' as TransferType,
                    document_number: '',
                    reason: '',
                  });
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
            className="p-6 text-center text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px]"
          >
            No transfers found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Date', 'Item', 'From', 'To', 'Type', 'Document #', 'Reason'].map((h) => (
                    <th
                      key={h}
                      className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)] py-2 px-2.5 text-left border-b border-b-[var(--color-border)]"
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
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)] whitespace-nowrap"
                      >
                        {new Date(transfer.transfer_date).toLocaleDateString()}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-[var(--color-text-bright)] font-semibold"
                      >
                        {matchItem?.serial_number ?? `Item #${transfer.sensitive_item_id}`}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-[var(--color-text)]"
                      >
                        {transfer.from_personnel_name ?? '—'}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-[var(--color-text)]"
                      >
                        <div className="flex items-center gap-1">
                          <ChevronRight
                            size={10}
                            className="text-[var(--color-text-muted)]"
                          />
                          {transfer.to_personnel_name ?? '—'}
                        </div>
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        <span
                          className="py-0.5 px-1.5 rounded-[3px] font-semibold text-[9px]" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                        >
                          {transfer.transfer_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)]"
                      >
                        {transfer.document_number ?? '—'}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-[var(--color-text-muted)] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
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
    <div className="flex flex-col gap-4">
      {missingCount > 0 && (
        <div
          className="py-3 px-4 bg-[rgba(239,68,68,0.12)] rounded-[var(--radius)] flex items-center gap-2.5 border border-[rgba(239,68,68,0.3)]"
        >
          <AlertTriangle size={16} className="text-[#ef4444] shrink-0" />
          <div>
            <div
              className="font-[var(--font-mono)] text-[11px] font-bold text-[#ef4444] mb-0.5"
            >
              {missingCount} SENSITIVE ITEM{missingCount !== 1 ? 'S' : ''} MISSING
            </div>
            <div
              className="font-[var(--font-mono)] text-[10px] text-[#f87171]"
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
    <div className="flex flex-col gap-4 p-0">
      {/* Page header */}
      <div
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <Shield size={18} className="text-[var(--color-accent)]" />
          <span
            className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-text-bright)] tracking-[1px]"
          >
            CHAIN OF CUSTODY
          </span>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div
        className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
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
            className="py-3.5 px-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)]"
          >
            <div
              className="flex items-center gap-1.5 mb-1.5"
            >
              <kpi.icon size={11} className="text-[var(--color-text-muted)]" />
              <span
                className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] text-[var(--color-text-muted)] uppercase"
              >
                {kpi.label}
              </span>
            </div>
            <div
              className="font-[var(--font-mono)] text-[22px] font-bold" style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Missing items alert */}
      {missingCount > 0 && activeTab !== 'missing' && (
        <div
          className="py-2 px-3 bg-[rgba(239,68,68,0.08)] rounded-[var(--radius)] flex items-center gap-2" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <AlertTriangle size={12} className="text-[#ef4444]" />
          <span
            className="font-[var(--font-mono)] text-[10px] font-bold text-[#ef4444] tracking-[1px]"
          >
            {missingCount} MISSING ITEM{missingCount !== 1 ? 'S' : ''} — IMMEDIATE ACTION REQUIRED
          </span>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-0.5 border-b border-b-[var(--color-border)] pb-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="py-2 px-4 font-[var(--font-mono)] text-[10px] tracking-[1.5px] uppercase border-0 bg-transparent cursor-pointer mb-[-1px] flex items-center gap-1.5" style={{ fontWeight: activeTab === tab.key ? 600 : 400, borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent)'
                  : '2px solid transparent', color: activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)', transition: 'all var(--transition)' }}
          >
            {tab.key === 'missing' && missingCount > 0 && (
              <span
                className="w-[6px] h-[6px] bg-[#ef4444] inline-block rounded-full"
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
