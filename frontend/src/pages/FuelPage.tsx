// =============================================================================
// FuelPage — Fuel / POL Management Dashboard
// =============================================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Fuel, AlertTriangle, Droplet, TrendingDown, Plus, Filter } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import Card from '@/components/ui/Card';
import FuelStorageCards from '@/components/fuel/FuelStorageCards';
import FuelForecastChart from '@/components/fuel/FuelForecastChart';
import FuelTransactionTable from '@/components/fuel/FuelTransactionTable';
import {
  getFuelDashboard,
  getFuelStoragePoints,
  getFuelTransactions,
  getFuelConsumptionRates,
  getFuelForecast,
} from '@/api/fuel';
import type {
  FuelStoragePoint,
  FuelTransaction,
  FuelConsumptionRate,
  FuelTransactionType,
  FuelFacilityType,
  FuelType,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'dashboard' as const, label: 'DASHBOARD' },
  { key: 'transactions' as const, label: 'TRANSACTIONS' },
  { key: 'storage' as const, label: 'STORAGE POINTS' },
  { key: 'consumption' as const, label: 'CONSUMPTION RATES' },
];

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function FuelPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedStorageId, setSelectedStorageId] = useState<number | null>(null);
  const selectedUnitId = useDashboardStore((s) => s.selectedUnitId);

  // Transaction filters
  const [txnFilterType, setTxnFilterType] = useState<string>('ALL');
  const [txnFilterSP, setTxnFilterSP] = useState<string>('ALL');
  const [txnFilterPeriod, setTxnFilterPeriod] = useState<number>(30);

  // New storage point form
  const [showNewSPForm, setShowNewSPForm] = useState(false);
  const [newSP, setNewSP] = useState({
    name: '',
    facility_type: 'FSP' as FuelFacilityType,
    fuel_type: 'JP8' as FuelType,
    capacity_gallons: 10000,
    mgrs: '',
    location_description: '',
  });

  // New transaction form
  const [showNewTxnForm, setShowNewTxnForm] = useState(false);
  const [newTxn, setNewTxn] = useState({
    storage_point_id: 1,
    transaction_type: 'ISSUE' as FuelTransactionType,
    fuel_type: 'JP8' as FuelType,
    quantity_gallons: 0,
    vehicle_bumper_number: '',
    vehicle_type: '',
    document_number: '',
    notes: '',
  });

  const numericUnitId = useMemo(() => {
    if (!selectedUnitId) return 4;
    const parsed = parseInt(selectedUnitId, 10);
    return isNaN(parsed) ? 4 : parsed;
  }, [selectedUnitId]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['fuel-dashboard', numericUnitId],
    queryFn: () => getFuelDashboard(numericUnitId),
  });

  const { data: storagePoints, isLoading: storageLoading } = useQuery({
    queryKey: ['fuel-storage-points', numericUnitId],
    queryFn: () => getFuelStoragePoints(numericUnitId),
  });

  const { data: transactions, isLoading: txnLoading } = useQuery({
    queryKey: ['fuel-transactions', numericUnitId, txnFilterPeriod],
    queryFn: () =>
      getFuelTransactions({ unit_id: numericUnitId, period_days: txnFilterPeriod }),
    enabled: activeTab === 'transactions' || activeTab === 'dashboard',
  });

  const { data: consumptionRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['fuel-consumption-rates'],
    queryFn: () => getFuelConsumptionRates(),
    enabled: activeTab === 'consumption',
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['fuel-forecast', numericUnitId],
    queryFn: () => getFuelForecast(numericUnitId),
  });

  // -------------------------------------------------------------------------
  // Filtered transactions
  // -------------------------------------------------------------------------

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    let result = [...transactions];
    if (txnFilterType !== 'ALL') {
      result = result.filter((t) => t.transaction_type === txnFilterType);
    }
    if (txnFilterSP !== 'ALL') {
      result = result.filter((t) => t.storage_point_id === Number(txnFilterSP));
    }
    return result;
  }, [transactions, txnFilterType, txnFilterSP]);

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
  // Dashboard tab content
  // -------------------------------------------------------------------------

  const renderDashboard = () => (
    <div className="flex flex-col gap-4">
      {/* Alert banner when DOS <= 3 */}
      {dashboard && dashboard.days_of_supply <= 3 && (
        <div
          className="py-3 px-4 bg-[rgba(239,68,68,0.12)] rounded-[var(--radius)] flex items-center gap-2.5 border border-[rgba(239,68,68,0.3)]"
        >
          <AlertTriangle size={16} className="text-[#ef4444] shrink-0" />
          <div>
            <div
              className="font-[var(--font-mono)] text-[11px] font-bold text-[#ef4444] mb-0.5"
            >
              FUEL CRITICAL — {dashboard.days_of_supply.toFixed(1)} DAYS OF SUPPLY
            </div>
            <div
              className="font-[var(--font-mono)] text-[10px] text-[#f87171]"
            >
              Limiting fuel type: {dashboard.limiting_fuel_type ?? 'N/A'}. Resupply required NLT{' '}
              {dashboard.forecast.resupply_required_by}.
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI cards */}
      {dashboardLoading ? (
        renderLoadingSkeleton()
      ) : (
        <div
          className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]"
        >
          {[
            {
              label: 'TOTAL CAPACITY',
              value: dashboard
                ? `${(dashboard.total_capacity_gallons / 1000).toFixed(0)}k gal`
                : '—',
              color: 'var(--color-text-bright)',
              icon: Droplet,
            },
            {
              label: 'ON HAND',
              value: dashboard
                ? `${(dashboard.total_on_hand_gallons / 1000).toFixed(1)}k gal`
                : '—',
              color: dashboard
                ? dashboard.fill_percentage > 50
                  ? '#22c55e'
                  : dashboard.fill_percentage >= 20
                    ? '#f59e0b'
                    : '#ef4444'
                : 'var(--color-text-muted)',
              icon: Fuel,
            },
            {
              label: 'DAYS OF SUPPLY',
              value: dashboard ? dashboard.days_of_supply.toFixed(1) : '—',
              color: dashboard
                ? dashboard.days_of_supply > 5
                  ? '#22c55e'
                  : dashboard.days_of_supply > 3
                    ? '#f59e0b'
                    : '#ef4444'
                : 'var(--color-text-muted)',
              icon: TrendingDown,
            },
            {
              label: 'DAILY CONSUMPTION',
              value: dashboard
                ? `${(dashboard.forecast.projected_daily_consumption / 1000).toFixed(1)}k gal`
                : '—',
              color: '#3b82f6',
              icon: AlertTriangle,
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
      )}

      {/* Storage point cards */}
      <Card title="STORAGE POINTS">
        {storageLoading ? (
          renderLoadingSkeleton()
        ) : (
          <FuelStorageCards
            storagePoints={storagePoints ?? []}
            selectedId={selectedStorageId}
            onSelect={setSelectedStorageId}
          />
        )}
      </Card>

      {/* Forecast chart */}
      <Card title="FUEL FORECAST PROJECTION">
        {forecastLoading ? (
          renderLoadingSkeleton()
        ) : forecast ? (
          <FuelForecastChart forecast={forecast} />
        ) : (
          <div
            className="p-8 text-center font-[var(--font-mono)] text-xs text-[var(--color-text-muted)]"
          >
            No forecast data available.
          </div>
        )}
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Transactions tab content
  // -------------------------------------------------------------------------

  const renderTransactions = () => (
    <div className="flex flex-col gap-4">
      {/* Filters + new transaction button */}
      <div
        className="flex justify-between items-end flex-wrap gap-3"
      >
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <span style={labelStyle}>
              <Filter size={8} className="inline mr-1" />
              TYPE
            </span>
            <select
              value={txnFilterType}
              onChange={(e) => setTxnFilterType(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Types</option>
              <option value="RECEIPT">Receipt</option>
              <option value="ISSUE">Issue</option>
              <option value="TRANSFER">Transfer</option>
              <option value="LOSS">Loss</option>
              <option value="SAMPLE">Sample</option>
            </select>
          </div>
          <div>
            <span style={labelStyle}>STORAGE POINT</span>
            <select
              value={txnFilterSP}
              onChange={(e) => setTxnFilterSP(e.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All Points</option>
              {(storagePoints ?? []).map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span style={labelStyle}>PERIOD</span>
            <select
              value={txnFilterPeriod}
              onChange={(e) => setTxnFilterPeriod(Number(e.target.value))}
              style={selectStyle}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowNewTxnForm((v) => !v)}
          style={{
            ...buttonStyle,
            backgroundColor: showNewTxnForm ? 'var(--color-bg)' : 'var(--color-accent)',
            color: showNewTxnForm ? 'var(--color-text)' : '#fff',
          }}
        >
          <Plus size={10} />
          {showNewTxnForm ? 'CANCEL' : 'RECORD TRANSACTION'}
        </button>
      </div>

      {/* New transaction form */}
      {showNewTxnForm && (
        <Card title="RECORD NEW TRANSACTION" accentColor="#3b82f6">
          <div
            className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
          >
            <div>
              <span style={labelStyle}>STORAGE POINT</span>
              <select
                value={newTxn.storage_point_id}
                onChange={(e) =>
                  setNewTxn({ ...newTxn, storage_point_id: Number(e.target.value) })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                {(storagePoints ?? []).map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span style={labelStyle}>TYPE</span>
              <select
                value={newTxn.transaction_type}
                onChange={(e) =>
                  setNewTxn({
                    ...newTxn,
                    transaction_type: e.target.value as FuelTransactionType,
                  })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="RECEIPT">Receipt</option>
                <option value="ISSUE">Issue</option>
                <option value="TRANSFER">Transfer</option>
                <option value="LOSS">Loss</option>
                <option value="SAMPLE">Sample</option>
              </select>
            </div>
            <div>
              <span style={labelStyle}>FUEL TYPE</span>
              <select
                value={newTxn.fuel_type}
                onChange={(e) =>
                  setNewTxn({ ...newTxn, fuel_type: e.target.value as FuelType })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="JP8">JP8</option>
                <option value="JP5">JP5</option>
                <option value="DF2">DF2</option>
                <option value="MOGAS">MOGAS</option>
              </select>
            </div>
            <div>
              <span style={labelStyle}>QUANTITY (GAL)</span>
              <input
                type="number"
                value={newTxn.quantity_gallons || ''}
                onChange={(e) =>
                  setNewTxn({ ...newTxn, quantity_gallons: Number(e.target.value) })
                }
                style={{ ...inputStyle, width: '100%' }}
                placeholder="0"
              />
            </div>
            <div>
              <span style={labelStyle}>BUMPER #</span>
              <input
                type="text"
                value={newTxn.vehicle_bumper_number}
                onChange={(e) =>
                  setNewTxn({ ...newTxn, vehicle_bumper_number: e.target.value })
                }
                style={{ ...inputStyle, width: '100%' }}
                placeholder="HQ-12"
              />
            </div>
            <div>
              <span style={labelStyle}>VEHICLE TYPE</span>
              <input
                type="text"
                value={newTxn.vehicle_type}
                onChange={(e) => setNewTxn({ ...newTxn, vehicle_type: e.target.value })}
                style={{ ...inputStyle, width: '100%' }}
                placeholder="JLTV"
              />
            </div>
            <div>
              <span style={labelStyle}>DOCUMENT #</span>
              <input
                type="text"
                value={newTxn.document_number}
                onChange={(e) =>
                  setNewTxn({ ...newTxn, document_number: e.target.value })
                }
                style={{ ...inputStyle, width: '100%' }}
                placeholder="FSP-I-2026-0001"
              />
            </div>
            <div>
              <span style={labelStyle}>NOTES</span>
              <input
                type="text"
                value={newTxn.notes}
                onChange={(e) => setNewTxn({ ...newTxn, notes: e.target.value })}
                style={{ ...inputStyle, width: '100%' }}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="text-[#fff]"
              onClick={() => setShowNewTxnForm(false)}
            >
              SUBMIT TRANSACTION
            </button>
          </div>
        </Card>
      )}

      {/* Transaction table */}
      <Card title="TRANSACTION HISTORY">
        {txnLoading ? (
          renderLoadingSkeleton()
        ) : (
          <FuelTransactionTable transactions={filteredTransactions} />
        )}
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Storage Points tab content
  // -------------------------------------------------------------------------

  const renderStoragePoints = () => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNewSPForm((v) => !v)}
          style={{
            ...buttonStyle,
            backgroundColor: showNewSPForm ? 'var(--color-bg)' : 'var(--color-accent)',
            color: showNewSPForm ? 'var(--color-text)' : '#fff',
          }}
        >
          <Plus size={10} />
          {showNewSPForm ? 'CANCEL' : 'NEW STORAGE POINT'}
        </button>
      </div>

      {/* New storage point form */}
      {showNewSPForm && (
        <Card title="CREATE STORAGE POINT" accentColor="#22c55e">
          <div
            className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
          >
            <div>
              <span style={labelStyle}>NAME</span>
              <input
                type="text"
                value={newSP.name}
                onChange={(e) => setNewSP({ ...newSP, name: e.target.value })}
                style={{ ...inputStyle, width: '100%' }}
                placeholder="FARP-Bravo"
              />
            </div>
            <div>
              <span style={labelStyle}>FACILITY TYPE</span>
              <select
                value={newSP.facility_type}
                onChange={(e) =>
                  setNewSP({ ...newSP, facility_type: e.target.value as FuelFacilityType })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="FARP">FARP</option>
                <option value="FSP">FSP</option>
                <option value="BSA_FUEL_POINT">BSA Fuel Point</option>
                <option value="MOBILE_REFUELER">Mobile Refueler</option>
                <option value="BLADDER_FARM">Bladder Farm</option>
                <option value="TANK_FARM">Tank Farm</option>
                <option value="DISTRIBUTED_CACHE">Distributed Cache</option>
              </select>
            </div>
            <div>
              <span style={labelStyle}>FUEL TYPE</span>
              <select
                value={newSP.fuel_type}
                onChange={(e) =>
                  setNewSP({ ...newSP, fuel_type: e.target.value as FuelType })
                }
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="JP8">JP8</option>
                <option value="JP5">JP5</option>
                <option value="DF2">DF2</option>
                <option value="MOGAS">MOGAS</option>
                <option value="MIXED">MIXED</option>
              </select>
            </div>
            <div>
              <span style={labelStyle}>CAPACITY (GAL)</span>
              <input
                type="number"
                value={newSP.capacity_gallons || ''}
                onChange={(e) =>
                  setNewSP({ ...newSP, capacity_gallons: Number(e.target.value) })
                }
                style={{ ...inputStyle, width: '100%' }}
                placeholder="10000"
              />
            </div>
            <div>
              <span style={labelStyle}>MGRS</span>
              <input
                type="text"
                value={newSP.mgrs}
                onChange={(e) => setNewSP({ ...newSP, mgrs: e.target.value })}
                style={{ ...inputStyle, width: '100%' }}
                placeholder="38SMB4512067890"
              />
            </div>
            <div>
              <span style={labelStyle}>LOCATION DESC</span>
              <input
                type="text"
                value={newSP.location_description}
                onChange={(e) =>
                  setNewSP({ ...newSP, location_description: e.target.value })
                }
                style={{ ...inputStyle, width: '100%' }}
                placeholder="MSR TAMPA km 12"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="text-[#fff]"
              onClick={() => setShowNewSPForm(false)}
            >
              CREATE STORAGE POINT
            </button>
          </div>
        </Card>
      )}

      {/* Storage points table */}
      <Card title="ALL STORAGE POINTS">
        {storageLoading ? (
          renderLoadingSkeleton()
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Name', 'Type', 'Fuel', 'Capacity', 'On Hand', 'Fill %', 'Status', 'MGRS', 'Last Resupply', 'Next ETA'].map(
                    (h) => (
                      <th
                        key={h}
                        className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)] py-2 px-2.5 text-left border-b border-b-[var(--color-border)] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(storagePoints ?? []).map((sp: FuelStoragePoint) => {
                  const fillColor =
                    sp.fill_percentage > 50
                      ? '#22c55e'
                      : sp.fill_percentage >= 20
                        ? '#f59e0b'
                        : '#ef4444';
                  const statusColor =
                    sp.status === 'OPERATIONAL'
                      ? '#22c55e'
                      : sp.status === 'DEGRADED'
                        ? '#f59e0b'
                        : '#ef4444';

                  return (
                    <tr key={sp.id}>
                      <td
                        className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        {sp.name}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text)] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        {sp.facility_type}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] text-[#3b82f6] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        {sp.fuel_type}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] py-2 px-2.5 border-b border-b-[var(--color-border)] text-right"
                      >
                        {sp.capacity_gallons.toLocaleString()}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] py-2 px-2.5 border-b border-b-[var(--color-border)] text-right"
                      >
                        {sp.current_gallons.toLocaleString()}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[11px] font-semibold py-2 px-2.5 border-b border-b-[var(--color-border)] text-right" style={{ color: fillColor }}
                      >
                        {sp.fill_percentage.toFixed(1)}%
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        <span
                          className="py-0.5 px-2 rounded-[3px] font-semibold text-[9px]" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                        >
                          {sp.status === 'NON_OPERATIONAL' ? 'NON-OP' : sp.status}
                        </span>
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        {sp.mgrs ?? '—'}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        {sp.last_resupply_date ?? '—'}
                      </td>
                      <td
                        className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                      >
                        {sp.next_resupply_eta ?? '—'}
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
  // Consumption Rates tab content
  // -------------------------------------------------------------------------

  const renderConsumptionRates = () => (
    <Card title="EQUIPMENT FUEL CONSUMPTION RATES">
      {ratesLoading ? (
        renderLoadingSkeleton()
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  'Equipment',
                  'Fuel',
                  'Idle (GPH)',
                  'Tactical (GPH)',
                  'Per Mile (GPM)',
                  'Per Flight Hr',
                  'Source',
                  'Notes',
                ].map((h) => (
                  <th
                    key={h}
                    className="font-[var(--font-mono)] text-[9px] font-semibold tracking-[1.5px] uppercase text-[var(--color-text-muted)] py-2 px-2.5 text-left border-b border-b-[var(--color-border)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(consumptionRates ?? []).map((rate: FuelConsumptionRate) => (
                <tr key={rate.id}>
                  <td
                    className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                  >
                    {rate.equipment_name ?? `Item #${rate.equipment_catalog_item_id}`}
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[10px] text-[#3b82f6] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                  >
                    {rate.fuel_type}
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] py-2 px-2.5 border-b border-b-[var(--color-border)] text-right"
                  >
                    {rate.gallons_per_hour_idle > 0 ? rate.gallons_per_hour_idle.toFixed(1) : '—'}
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-bright)] py-2 px-2.5 border-b border-b-[var(--color-border)] text-right"
                  >
                    {rate.gallons_per_hour_tactical > 0
                      ? rate.gallons_per_hour_tactical.toFixed(1)
                      : '—'}
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] py-2 px-2.5 border-b border-b-[var(--color-border)] text-right"
                  >
                    {rate.gallons_per_mile != null ? rate.gallons_per_mile.toFixed(2) : '—'}
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[11px] py-2 px-2.5 border-b border-b-[var(--color-border)] text-right" style={{ fontWeight: rate.gallons_per_flight_hour != null ? 600 : 400, color: rate.gallons_per_flight_hour != null
                          ? '#f59e0b'
                          : 'var(--color-text-muted)' }}
                  >
                    {rate.gallons_per_flight_hour != null
                      ? `${rate.gallons_per_flight_hour} gal/hr`
                      : '—'}
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[9px] py-2 px-2.5 border-b border-b-[var(--color-border)]"
                  >
                    <span
                      className="py-0.5 px-1.5 rounded-[3px] font-semibold" style={{ backgroundColor: rate.source === 'TM_REFERENCE'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : rate.source === 'CALCULATED'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)', color: rate.source === 'TM_REFERENCE'
                            ? '#22c55e'
                            : rate.source === 'CALCULATED'
                              ? '#3b82f6'
                              : '#94a3b8' }}
                    >
                      {rate.source}
                    </span>
                  </td>
                  <td
                    className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2 px-2.5 border-b border-b-[var(--color-border)] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={rate.notes ?? ''}
                  >
                    {rate.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  // -------------------------------------------------------------------------
  // Page layout
  // -------------------------------------------------------------------------

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* Page header */}
      <div
        className="flex items-center justify-between"
      >
        <div
          className="flex items-center gap-2.5"
        >
          <Fuel size={18} className="text-[#f59e0b]" />
          <span
            className="font-[var(--font-mono)] text-sm font-bold tracking-[3px] text-[var(--color-text-bright)] uppercase"
          >
            FUEL / POL MANAGEMENT
          </span>
        </div>
        {dashboard && dashboard.alert && (
          <div
            className="flex items-center gap-1.5 py-1 px-2.5 bg-[rgba(239,68,68,0.12)] rounded-[var(--radius)] border border-[rgba(239,68,68,0.3)]"
          >
            <AlertTriangle size={12} className="text-[#ef4444]" />
            <span
              className="font-[var(--font-mono)] text-[10px] font-bold text-[#ef4444] tracking-[1px]"
            >
              {dashboard.days_of_supply.toFixed(1)} DOS
            </span>
          </div>
        )}
      </div>

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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'storage' && renderStoragePoints()}
      {activeTab === 'consumption' && renderConsumptionRates()}
    </div>
  );
}
