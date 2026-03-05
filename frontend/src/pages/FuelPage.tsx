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
  // Dashboard tab content
  // -------------------------------------------------------------------------

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Alert banner when DOS <= 3 */}
      {dashboard && dashboard.days_of_supply <= 3 && (
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
              FUEL CRITICAL — {dashboard.days_of_supply.toFixed(1)} DAYS OF SUPPLY
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#f87171',
              }}
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}
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
            style={{
              padding: 32,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters + new transaction button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <span style={labelStyle}>
              <Filter size={8} style={{ display: 'inline', marginRight: 4 }} />
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
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
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
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{
                ...buttonStyle,
                backgroundColor: 'var(--color-accent)',
                color: '#fff',
              }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
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
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              style={{
                ...buttonStyle,
                backgroundColor: '#22c55e',
                color: '#fff',
              }}
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Type', 'Fuel', 'Capacity', 'On Hand', 'Fill %', 'Status', 'MGRS', 'Last Resupply', 'Next ETA'].map(
                    (h) => (
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
                          whiteSpace: 'nowrap',
                        }}
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
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--color-text-bright)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {sp.name}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {sp.facility_type}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: '#3b82f6',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {sp.fuel_type}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--color-text)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          textAlign: 'right',
                        }}
                      >
                        {sp.capacity_gallons.toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--color-text)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          textAlign: 'right',
                        }}
                      >
                        {sp.current_gallons.toLocaleString()}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          color: fillColor,
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                          textAlign: 'right',
                        }}
                      >
                        {sp.fill_percentage.toFixed(1)}%
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
                            padding: '2px 8px',
                            borderRadius: 3,
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                            fontWeight: 600,
                            fontSize: 9,
                          }}
                        >
                          {sp.status === 'NON_OPERATIONAL' ? 'NON-OP' : sp.status}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {sp.mgrs ?? '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        {sp.last_resupply_date ?? '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          padding: '8px 10px',
                          borderBottom: '1px solid var(--color-border)',
                        }}
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      whiteSpace: 'nowrap',
                    }}
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
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-bright)',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {rate.equipment_name ?? `Item #${rate.equipment_catalog_item_id}`}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: '#3b82f6',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {rate.fuel_type}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text)',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'right',
                    }}
                  >
                    {rate.gallons_per_hour_idle > 0 ? rate.gallons_per_hour_idle.toFixed(1) : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-bright)',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'right',
                    }}
                  >
                    {rate.gallons_per_hour_tactical > 0
                      ? rate.gallons_per_hour_tactical.toFixed(1)
                      : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text)',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'right',
                    }}
                  >
                    {rate.gallons_per_mile != null ? rate.gallons_per_mile.toFixed(2) : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: rate.gallons_per_flight_hour != null ? 600 : 400,
                      color:
                        rate.gallons_per_flight_hour != null
                          ? '#f59e0b'
                          : 'var(--color-text-muted)',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'right',
                    }}
                  >
                    {rate.gallons_per_flight_hour != null
                      ? `${rate.gallons_per_flight_hour} gal/hr`
                      : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        backgroundColor:
                          rate.source === 'TM_REFERENCE'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : rate.source === 'CALCULATED'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                        color:
                          rate.source === 'TM_REFERENCE'
                            ? '#22c55e'
                            : rate.source === 'CALCULATED'
                              ? '#3b82f6'
                              : '#94a3b8',
                        fontWeight: 600,
                      }}
                    >
                      {rate.source}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--color-border)',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Fuel size={18} style={{ color: '#f59e0b' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '3px',
              color: 'var(--color-text-bright)',
              textTransform: 'uppercase',
            }}
          >
            FUEL / POL MANAGEMENT
          </span>
        </div>
        {dashboard && dashboard.alert && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius)',
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
              {dashboard.days_of_supply.toFixed(1)} DOS
            </span>
          </div>
        )}
      </div>

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
