import type { MaintenanceWorkOrder, MaintenancePart, MaintenanceLabor, WorkOrderCategory } from '@/lib/types';
import { WorkOrderStatus, WorkOrderCategory as WOCat, PartSource, PartStatus, LaborType } from '@/lib/types';

// Re-export types for convenience
export type { MaintenanceWorkOrder, MaintenancePart, MaintenanceLabor, WorkOrderCategory };
export { WorkOrderStatus, WOCat, PartSource, PartStatus, LaborType };

// ---------------------------------------------------------------------------
// Shared helper functions
// ---------------------------------------------------------------------------

export function getStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case WorkOrderStatus.OPEN: return 'var(--color-warning)';
    case WorkOrderStatus.IN_PROGRESS: return 'var(--color-accent)';
    case WorkOrderStatus.AWAITING_PARTS: return '#e67e22';
    case WorkOrderStatus.COMPLETE: return 'var(--color-success)';
    default: return 'var(--color-text-muted)';
  }
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'URGENT';
    case 2: return 'PRIORITY';
    case 3: return 'ROUTINE';
    default: return 'ROUTINE';
  }
}

export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1: return 'var(--color-danger)';
    case 2: return 'var(--color-warning)';
    default: return 'var(--color-text-muted)';
  }
}

export function getPartStatusColor(status: PartStatus): string {
  switch (status) {
    case PartStatus.NEEDED: return 'var(--color-warning)';
    case PartStatus.ON_ORDER: return '#e67e22';
    case PartStatus.RECEIVED: return 'var(--color-accent)';
    case PartStatus.INSTALLED: return 'var(--color-success)';
    default: return 'var(--color-text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

export const badgeStyle = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '2px 8px',
  borderRadius: 2,
  border: `1px solid ${color}`,
  color,
  backgroundColor: `${color}15`,
  whiteSpace: 'nowrap',
});

export const sectionLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: 4,
};

export const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--color-text-bright)',
};

export const thStyle = (align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  padding: '6px 10px',
  textAlign: align,
  borderBottom: '1px solid var(--color-border)',
  letterSpacing: '1px',
});

export const tdStyle = (mono = false, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
  fontFamily: mono ? 'var(--font-mono)' : 'inherit',
  fontSize: 10,
  padding: '6px 10px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  textAlign: align,
});

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
};

export const formLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 28,
};

export const smallBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: 3,
  borderRadius: 2,
};

export const actionBtnStyle = (
  bg: string,
  fg: string,
  disabled?: boolean,
): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '1px',
  padding: '6px 14px',
  border: 'none',
  borderRadius: 'var(--radius)',
  backgroundColor: disabled ? 'var(--color-text-muted)' : bg,
  color: fg,
  cursor: disabled ? 'not-allowed' : 'pointer',
  textTransform: 'uppercase',
  opacity: disabled ? 0.6 : 1,
  whiteSpace: 'nowrap',
});

export const inlineTdInput: React.CSSProperties = {
  ...inputStyle,
  padding: '4px 6px',
  fontSize: 10,
};

export const inlineTdSelect: React.CSSProperties = {
  ...selectStyle,
  padding: '4px 6px',
  fontSize: 10,
};
