import { useState } from 'react';
import { Wrench, Clock, Package } from 'lucide-react';
import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { formatRelativeTime } from '@/lib/utils';

interface WorkOrder {
  id: string;
  equipment: string;
  tamcn: string;
  unit: string;
  fault: string;
  priority: 'URGENT' | 'PRIORITY' | 'ROUTINE';
  status: 'OPEN' | 'IN_PROGRESS' | 'PARTS_ON_ORDER' | 'COMPLETE';
  openedAt: string;
  eta?: string;
  partsCount: number;
  laborHours: number;
}

const demoOrders: WorkOrder[] = [
  { id: 'WO-001', equipment: 'AAV #12', tamcn: 'E0902', unit: '1/1 BN', fault: 'Engine overheating - water pump failure', priority: 'URGENT', status: 'PARTS_ON_ORDER', openedAt: '2026-03-01T14:00:00Z', eta: '48hrs', partsCount: 2, laborHours: 6.5 },
  { id: 'WO-002', equipment: 'AAV #08', tamcn: 'E0902', unit: '1/1 BN', fault: 'Transmission oil leak', priority: 'URGENT', status: 'IN_PROGRESS', openedAt: '2026-03-02T08:00:00Z', partsCount: 2, laborHours: 4.0 },
  { id: 'WO-003', equipment: 'HMMWV #34', tamcn: 'D1092', unit: '1/1 BN', fault: 'Alternator replacement', priority: 'PRIORITY', status: 'IN_PROGRESS', openedAt: '2026-03-02T10:00:00Z', partsCount: 2, laborHours: 3.0 },
  { id: 'WO-004', equipment: 'MTVR #18', tamcn: 'D0095', unit: '2/1 BN', fault: 'Brake line repair', priority: 'PRIORITY', status: 'OPEN', openedAt: '2026-03-03T06:00:00Z', partsCount: 1, laborHours: 1.0 },
  { id: 'WO-005', equipment: 'JLTV #22', tamcn: 'D1200', unit: '1/1 BN', fault: 'CTIS fault', priority: 'ROUTINE', status: 'OPEN', openedAt: '2026-03-03T07:00:00Z', partsCount: 0, laborHours: 0.5 },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'URGENT': return 'var(--color-danger)';
    case 'PRIORITY': return 'var(--color-warning)';
    default: return 'var(--color-text-muted)';
  }
}

function getWOStatusColor(status: string) {
  switch (status) {
    case 'COMPLETE': return 'GREEN';
    case 'IN_PROGRESS': return 'AMBER';
    case 'PARTS_ON_ORDER': return 'RED';
    default: return 'AMBER';
  }
}

export default function MaintenanceQueue() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Card
      title="MAINTENANCE WORK ORDERS"
      headerRight={
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-muted)',
          }}
        >
          {demoOrders.length} OPEN
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {demoOrders.map((wo) => (
          <div
            key={wo.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              backgroundColor: selectedId === wo.id ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)',
              border: selectedId === wo.id ? '1px solid var(--color-text-muted)' : '1px solid var(--color-border)',
              borderLeft: `3px solid ${getPriorityColor(wo.priority)}`,
              borderRadius: 'var(--radius)',
              transition: 'background-color var(--transition)',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedId(selectedId === wo.id ? null : wo.id)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = selectedId === wo.id ? 'var(--color-bg-hover)' : 'var(--color-bg-surface)')
            }
          >
            <Wrench size={14} style={{ color: 'var(--color-text-muted)', marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-text-bright)',
                      fontWeight: 600,
                    }}
                  >
                    {wo.equipment}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: getPriorityColor(wo.priority),
                      fontWeight: 600,
                      letterSpacing: '1px',
                    }}
                  >
                    {wo.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot status={getWOStatusColor(wo.status)} size={6} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--color-text-muted)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {wo.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  marginBottom: 4,
                }}
              >
                {wo.fault}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  marginBottom: 4,
                }}
              >
                <span>{wo.id}</span>
                <span>{wo.unit}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={9} />
                  {formatRelativeTime(wo.openedAt)}
                </span>
                {wo.eta && <span>ETA: {wo.eta}</span>}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Package size={9} />
                  {wo.partsCount} {wo.partsCount === 1 ? 'part' : 'parts'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={9} />
                  {wo.laborHours}h labor
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
