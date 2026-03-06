// =============================================================================
// InventoryPanel — Inventory table + low stock alerts
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { getInventory, getLowStockAlerts } from '@/api/requisitions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InventoryPanelProps {
  unitId?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InventoryPanel({ unitId }: InventoryPanelProps) {
  const {
    data: inventory,
    isLoading: invLoading,
  } = useQuery({
    queryKey: ['inventory', unitId],
    queryFn: () => getInventory(unitId),
  });

  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: ['low-stock-alerts', unitId],
    queryFn: () => getLowStockAlerts(unitId),
  });

  const headerStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  };

  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap',
  };

  const renderLoading = () => (
    <div className="p-10 text-center">
      <div
        className="skeleton w-[200px] h-[16px] mx-auto mb-3"
      />
      <div
        className="skeleton w-[300px] h-[12px] mx-auto"
        
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Low Stock Alerts */}
      {alertsLoading ? (
        renderLoading()
      ) : alerts && alerts.length > 0 ? (
        <Card title="LOW STOCK ALERTS" accentColor="var(--color-danger)">
          <div
            className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
          >
            {alerts.map((alert) => (
              <div
                key={alert.inventory_record_id}
                className="py-2.5 px-3 bg-[rgba(255,107,107,0.05)] rounded-[var(--radius)] flex flex-col gap-1.5 border border-[rgba(255,107,107,0.2)]"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-[var(--color-danger)] shrink-0" />
                  <span
                    className="font-[var(--font-mono)] text-[11px] font-bold text-[var(--color-text-bright)]"
                  >
                    {alert.nomenclature}
                  </span>
                </div>
                <div
                  className="flex gap-3 font-[var(--font-mono)] text-[10px]"
                >
                  <span className="text-[var(--color-text-muted)]">
                    ON HAND: <span className="text-[var(--color-danger)] font-bold">{alert.quantity_on_hand}</span>
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    REORDER PT: <span className="text-[var(--color-text)] font-semibold">{alert.reorder_point}</span>
                  </span>
                  <span className="text-[var(--color-danger)] font-bold">
                    -{alert.quantity_below} BELOW
                  </span>
                </div>
                <div
                  className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]"
                >
                  {alert.location}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Inventory Table */}
      <Card title="INVENTORY RECORDS">
        {invLoading ? (
          renderLoading()
        ) : inventory && inventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={headerStyle}>LOCATION</th>
                  <th style={headerStyle}>NSN</th>
                  <th style={headerStyle}>ITEM</th>
                  <th style={{ ...headerStyle, textAlign: 'right' }}>ON HAND</th>
                  <th style={{ ...headerStyle, textAlign: 'right' }}>ON ORDER</th>
                  <th style={{ ...headerStyle, textAlign: 'right' }}>DUE OUT</th>
                  <th style={headerStyle}>CONDITION</th>
                  <th style={headerStyle}>LAST COUNT</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((rec) => {
                  const isLow = rec.reorder_point != null && rec.quantity_on_hand < rec.reorder_point;
                  return (
                    <tr key={rec.id}>
                      <td
                        className="max-w-[180px] overflow-hidden text-ellipsis"
                      >
                        {rec.location}
                      </td>
                      <td style={{ ...cellStyle, color: 'var(--color-accent)' }}>
                        {rec.nsn ?? '--'}
                      </td>
                      <td style={cellStyle}>{rec.nomenclature}</td>
                      <td
                        className="font-bold" style={{ color: isLow ? 'var(--color-danger)' : 'var(--color-text-bright)' }}
                      >
                        {rec.quantity_on_hand.toLocaleString()}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>
                        {rec.quantity_on_order.toLocaleString()}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>
                        {rec.quantity_due_out.toLocaleString()}
                      </td>
                      <td style={cellStyle}>
                        <span
                          className="inline-block py-px px-1.5 rounded-[2px] text-[9px] font-bold tracking-[0.5px]" style={{ color: rec.condition_code === 'A' ? 'var(--color-success)' : 'var(--color-warning)', border: `1px solid ${rec.condition_code === 'A' ? 'var(--color-success)' : 'var(--color-warning)'}`, backgroundColor: rec.condition_code === 'A'
                              ? 'rgba(64, 192, 87, 0.1)'
                              : 'rgba(250, 176, 5, 0.1)' }}
                        >
                          {rec.condition_code}
                        </span>
                      </td>
                      <td className="text-[var(--color-text-muted)]">
                        {new Date(rec.last_inventory_date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Package size={32} />}
            title="NO INVENTORY RECORDS"
            message="Inventory records will appear here"
          />
        )}
      </Card>
    </div>
  );
}
