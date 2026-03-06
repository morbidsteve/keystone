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
    <div className="animate-fade-in flex flex-col gap-4">
      {/* My Assigned Tasks */}
      <Card title="MY ASSIGNED TASKS" accentColor="var(--color-accent)">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse font-[var(--font-mono)] text-[11px]"
          >
            <thead>
              <tr>
                {['TASK', 'TYPE', 'STATUS', 'DUE DATE', 'PRIORITY'].map((header) => (
                  <th
                    key={header}
                    className="text-left py-2 px-3 font-semibold text-[9px] tracking-[1.5px] text-[var(--color-text-muted)] border-b border-b-[var(--color-border)] uppercase"
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
                  className="border-b border-b-[var(--color-border)] cursor-pointer transition-colors duration-[var(--transition)]"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <td className="py-2.5 px-3 text-[var(--color-text)]">
                    {task.task}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={task.type} label={task.type} />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={task.status} label={task.status.replace('_', ' ')} />
                  </td>
                  <td
                    className="py-2.5 px-3 text-[var(--color-text-muted)] whitespace-nowrap"
                  >
                    {task.dueDate}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className="font-[var(--font-mono)] text-[10px] font-semibold tracking-[1px]" style={{ color: getPriorityColor(task.priority) }}
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
        <div className="flex flex-col gap-0">
          {demoRecentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-0 border-b border-b-[var(--color-border)]"
            >
              <span
                className="font-[var(--font-mono)] text-[8px] font-semibold tracking-[1px] min-w-[60px] uppercase" style={{ color: getActionColor(item.action) }}
              >
                {item.action}
              </span>
              <span
                className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)] flex-1"
              >
                {item.description}
              </span>
              <span
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] whitespace-nowrap"
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
