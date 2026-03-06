import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

interface AssignedTask {
  id: string;
  task: string;
  type: 'Work Order' | 'Requisition' | 'Convoy';
  status: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface RecentItem {
  id: string;
  description: string;
  timestamp: string;
  action: string;
}

const demoTasks: AssignedTask[] = [
  { id: '1', task: 'Replace alternator - HMMWV #2247', type: 'Work Order', status: 'IN_PROGRESS', dueDate: '2026-03-07', priority: 'HIGH' },
  { id: '2', task: 'CL IX parts request - brake assemblies', type: 'Requisition', status: 'PENDING', dueDate: '2026-03-08', priority: 'HIGH' },
  { id: '3', task: 'MSR EAGLE resupply convoy', type: 'Convoy', status: 'PLANNED', dueDate: '2026-03-09', priority: 'MEDIUM' },
  { id: '4', task: 'PMCS inspection - 7-ton fleet', type: 'Work Order', status: 'SCHEDULED', dueDate: '2026-03-10', priority: 'MEDIUM' },
  { id: '5', task: 'CL I subsistence reorder', type: 'Requisition', status: 'APPROVED', dueDate: '2026-03-08', priority: 'LOW' },
  { id: '6', task: 'Generator service - MEP-803A', type: 'Work Order', status: 'IN_PROGRESS', dueDate: '2026-03-07', priority: 'HIGH' },
  { id: '7', task: 'Route clearance - MSR FALCON', type: 'Convoy', status: 'PENDING', dueDate: '2026-03-11', priority: 'MEDIUM' },
];

const demoRecentActivity: RecentItem[] = [
  { id: '1', description: 'Updated WO #4421 status to IN_PROGRESS', timestamp: '10 min ago', action: 'UPDATE' },
  { id: '2', description: 'Submitted REQ #882 for CL IX brake assemblies', timestamp: '35 min ago', action: 'CREATE' },
  { id: '3', description: 'Completed PMCS on HMMWV #2244', timestamp: '1 hr ago', action: 'COMPLETE' },
  { id: '4', description: 'Added notes to convoy MSR EAGLE', timestamp: '2 hrs ago', action: 'UPDATE' },
  { id: '5', description: 'Acknowledged alert: CL V low stock', timestamp: '2 hrs ago', action: 'ACK' },
  { id: '6', description: 'Closed WO #4418 - transmission repair', timestamp: '3 hrs ago', action: 'COMPLETE' },
  { id: '7', description: 'Requested parts for generator MEP-803A', timestamp: '4 hrs ago', action: 'CREATE' },
  { id: '8', description: 'Updated fuel consumption log', timestamp: '5 hrs ago', action: 'UPDATE' },
  { id: '9', description: 'Submitted convoy manifest for review', timestamp: '6 hrs ago', action: 'CREATE' },
  { id: '10', description: 'Completed inventory count - CL II', timestamp: '7 hrs ago', action: 'COMPLETE' },
];

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'HIGH': return 'var(--color-danger)';
    case 'MEDIUM': return 'var(--color-warning)';
    case 'LOW': return 'var(--color-success)';
    default: return 'var(--color-text-muted)';
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case 'CREATE': return 'var(--color-accent)';
    case 'UPDATE': return 'var(--color-warning)';
    case 'COMPLETE': return 'var(--color-success)';
    case 'ACK': return 'var(--color-text-muted)';
    default: return 'var(--color-text-muted)';
  }
}

export default function OperatorDashboard() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* My Assigned Tasks */}
      <Card title="MY ASSIGNED TASKS" accentColor="var(--color-accent)">
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            <thead>
              <tr>
                {['TASK', 'TYPE', 'STATUS', 'DUE DATE', 'PRIORITY'].map((header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '1.5px',
                      color: 'var(--color-text-muted)',
                      borderBottom: '1px solid var(--color-border)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoTasks.map((task) => (
                <tr
                  key={task.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color var(--transition)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>
                    {task.task}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <StatusBadge status={task.type} label={task.type} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <StatusBadge status={task.status} label={task.status.replace('_', ' ')} />
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.dueDate}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 600,
                        color: getPriorityColor(task.priority),
                        letterSpacing: '1px',
                      }}
                    >
                      {task.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card title="RECENT ACTIVITY">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {demoRecentActivity.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: getActionColor(item.action),
                  minWidth: 60,
                  textTransform: 'uppercase',
                }}
              >
                {item.action}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                  flex: 1,
                }}
              >
                {item.description}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.timestamp}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
