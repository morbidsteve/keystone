import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useModalStore, type ModalType } from '@/stores/modalStore';

interface QuickAction {
  label: string;
  onClick: () => void;
}

interface ActionDef {
  label: string;
  /** If set, opens this modal instead of navigating */
  modal?: ModalType;
  route: string;
  tab?: string;
  toastMsg: string;
}

const PAGE_ACTIONS: Record<string, ActionDef[]> = {
  '/supply': [
    { label: 'New Requisition', modal: 'create-requisition', route: '/requisitions', toastMsg: 'Navigated to Requisitions — use the NEW REQUISITION button to create' },
    { label: 'Record Receipt', route: '/supply', toastMsg: 'Use the Supply page to record a receipt' },
  ],
  '/equipment': [
    { label: 'Create Work Order', modal: 'create-work-order', route: '/maintenance', toastMsg: 'Navigated to Maintenance — open Work Orders tab to create' },
    { label: 'Report Fault', modal: 'create-work-order', route: '/maintenance', toastMsg: 'Navigated to Maintenance — report a fault via Work Orders' },
  ],
  '/maintenance': [
    { label: 'New Work Order', modal: 'create-work-order', route: '/maintenance', toastMsg: 'Use the Work Orders tab to create a new work order' },
    { label: 'Schedule PM', route: '/maintenance', toastMsg: 'Use the PM Schedule tab to schedule preventive maintenance' },
  ],
  '/transportation': [
    { label: 'Plan Convoy', modal: 'plan-convoy', route: '/transportation', toastMsg: 'Use the Convoy Planning tab to plan a new convoy' },
    { label: 'Create Lift Request', route: '/transportation', toastMsg: 'Use the Lift Requests tab to create a new request' },
  ],
  '/personnel': [
    { label: 'Add Marine', route: '/personnel', toastMsg: 'Use the Alpha Roster tab to add a new Marine' },
    { label: 'Record Qualification', route: '/personnel', toastMsg: 'Use the Qualifications tab to record a qualification' },
  ],
  '/requisitions': [
    { label: 'New Requisition', modal: 'create-requisition', route: '/requisitions', toastMsg: 'Use the NEW REQUISITION button above to create' },
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
  const navigate = useNavigate();
  const toast = useToast();
  const openModal = useModalStore((s) => s.openModal);
  const [open, setOpen] = useState(false);

  const actionDefs = PAGE_ACTIONS[location.pathname];
  if (!actionDefs || actionDefs.length === 0) return null;

  const actions: QuickAction[] = actionDefs.map((a) => ({
    label: a.label,
    onClick: () => {
      setOpen(false);
      if (a.modal) {
        openModal(a.modal);
      } else {
        if (a.route !== location.pathname) {
          navigate(a.route);
        }
        toast.info(a.toastMsg);
      }
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
    <div className="relative">
      <button style={buttonStyle} onClick={() => setOpen((v) => !v)}>
        <Plus size={14} />
        NEW
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed z-[1100] inset-0"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 mt-1.5 min-w-[200px] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius)] z-[1101] overflow-hidden" style={{ top: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-2 w-full py-2.5 px-3.5 bg-transparent border-0 cursor-pointer text-[var(--color-text)] font-[var(--font-mono)] text-[11px] tracking-[1px] text-left transition-colors duration-[var(--transition)]"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <Plus size={12} className="text-[var(--color-accent)]" />
                {action.label.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
