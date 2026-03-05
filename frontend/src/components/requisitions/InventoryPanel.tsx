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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Low Stock Alerts */}
      {alertsLoading ? (
        renderLoading()
      ) : alerts && alerts.length > 0 ? (
        <Card title="LOW STOCK ALERTS" accentColor="var(--color-danger)">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 10,
            }}
          >
            {alerts.map((alert) => (
              <div
                key={alert.inventory_record_id}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 107, 107, 0.05)',
                  border: '1px solid rgba(255, 107, 107, 0.2)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-text-bright)',
                    }}
                  >
                    {alert.nomenclature}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    ON HAND: <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{alert.quantity_on_hand}</span>
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    REORDER PT: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{alert.reorder_point}</span>
                  </span>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                    -{alert.quantity_below} BELOW
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                  }}
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                        style={{
                          ...cellStyle,
                          fontSize: 10,
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {rec.location}
                      </td>
                      <td style={{ ...cellStyle, color: 'var(--color-accent)' }}>
                        {rec.nsn ?? '--'}
                      </td>
                      <td style={cellStyle}>{rec.nomenclature}</td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isLow ? 'var(--color-danger)' : 'var(--color-text-bright)',
                        }}
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
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 2,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            color: rec.condition_code === 'A' ? 'var(--color-success)' : 'var(--color-warning)',
                            border: `1px solid ${rec.condition_code === 'A' ? 'var(--color-success)' : 'var(--color-warning)'}`,
                            backgroundColor: rec.condition_code === 'A'
                              ? 'rgba(64, 192, 87, 0.1)'
                              : 'rgba(250, 176, 5, 0.1)',
                          }}
                        >
                          {rec.condition_code}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontSize: 10, color: 'var(--color-text-muted)' }}>
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
