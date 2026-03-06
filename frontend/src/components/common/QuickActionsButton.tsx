import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';

interface QuickAction {
  label: string;
  onClick: () => void;
}

const PAGE_ACTIONS: Record<string, { label: string }[]> = {
  '/supply': [
    { label: 'New Requisition' },
    { label: 'Record Receipt' },
  ],
  '/equipment': [
    { label: 'Create Work Order' },
    { label: 'Report Fault' },
  ],
  '/maintenance': [
    { label: 'New Work Order' },
    { label: 'Schedule PM' },
  ],
  '/transportation': [
    { label: 'Plan Convoy' },
    { label: 'Create Lift Request' },
  ],
  '/personnel': [
    { label: 'Add Marine' },
    { label: 'Record Qualification' },
  ],
  '/requisitions': [
    { label: 'New Requisition' },
  ],
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '1px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 12px',
  whiteSpace: 'nowrap',
};

export default function QuickActionsButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const actionDefs = PAGE_ACTIONS[location.pathname];
  if (!actionDefs || actionDefs.length === 0) return null;

  const actions: QuickAction[] = actionDefs.map((a) => ({
    label: a.label,
    onClick: () => {
      console.log(`[QuickAction] ${a.label}`);
      setOpen(false);
    },
  }));

  // Single action: render a plain button
  if (actions.length === 1) {
    return (
      <button style={buttonStyle} onClick={actions[0].onClick}>
        <Plus size={14} />
        {actions[0].label.toUpperCase()}
      </button>
    );
  }

  // Multiple actions: render dropdown
  return (
    <div style={{ position: 'relative' }}>
      <button style={buttonStyle} onClick={() => setOpen((v) => !v)}>
        <Plus size={14} />
        NEW
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1100 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              minWidth: 200,
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              zIndex: 1101,
              overflow: 'hidden',
            }}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '1px',
                  textAlign: 'left',
                  transition: 'background-color var(--transition)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <Plus size={12} style={{ color: 'var(--color-accent)' }} />
                {action.label.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
