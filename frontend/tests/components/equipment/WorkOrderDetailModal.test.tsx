import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock all sub-components
vi.mock('../../../src/components/equipment/work-order/useWorkOrderState', () => ({
  useWorkOrderState: vi.fn(),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderHeader', () => ({
  default: ({ wo, onClose }: any) =>
    React.createElement('div', { 'data-testid': 'wo-header' },
      React.createElement('span', null, wo.workOrderNumber),
      React.createElement('button', { 'data-testid': 'header-close', onClick: onClose }, 'X'),
    ),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderStatusBar', () => ({
  default: ({ transitions, statusLoading, onStatusChange }: any) =>
    React.createElement('div', { 'data-testid': 'wo-status-bar' },
      transitions?.map((t: string) =>
        React.createElement('button', {
          key: t,
          'data-testid': `status-${t}`,
          onClick: () => onStatusChange(t),
        }, t),
      ),
    ),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderErrorBar', () => ({
  default: ({ error, onDismiss }: any) =>
    React.createElement('div', { 'data-testid': 'wo-error' },
      React.createElement('span', null, error),
      React.createElement('button', { 'data-testid': 'dismiss-error', onClick: onDismiss }, 'Dismiss'),
    ),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderInfo', () => ({
  default: () => React.createElement('div', { 'data-testid': 'wo-info' }),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderParts', () => ({
  default: () => React.createElement('div', { 'data-testid': 'wo-parts' }),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderLabor', () => ({
  default: () => React.createElement('div', { 'data-testid': 'wo-labor' }),
}));

vi.mock('../../../src/components/equipment/work-order/WorkOrderHistory', () => ({
  default: () => React.createElement('div', { 'data-testid': 'wo-history' }),
}));

vi.mock('../../../src/api/mockClient', () => ({
  isDemoMode: false,
  mockApi: {},
}));

vi.mock('../../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [],
}));

vi.mock('../../../src/api/mockData', () => ({
  DEMO_SUPPLY_RECORDS: [],
  DEMO_INDIVIDUAL_EQUIPMENT: [],
  DEMO_WORK_ORDERS: [],
  DEMO_UNITS: [],
  DEMO_ALERTS: [],
  DEMO_MOVEMENTS: [],
  DEMO_REPORTS: [],
  DEMO_PERSONNEL: [],
}));

import WorkOrderDetailModal from '../../../src/components/equipment/WorkOrderDetailModal';
import { useWorkOrderState } from '../../../src/components/equipment/work-order/useWorkOrderState';

const MOCK_WORK_ORDER = {
  id: 'wo-1',
  unitId: 'u1',
  workOrderNumber: 'WO-2026-0001',
  description: 'Replace transmission filter',
  status: 'OPEN',
  priority: 2,
  createdAt: '2026-01-15T10:00:00Z',
};

const DEFAULT_STATE = {
  wo: MOCK_WORK_ORDER,
  transitions: ['IN_PROGRESS'],
  statusLoading: false,
  handleStatusChange: vi.fn(),
  error: null,
  setError: vi.fn(),
  totalLaborHours: 4.5,
  totalPartsCost: 125.50,
  editMode: false,
  editSaving: false,
  editDescription: '',
  editPriority: 2,
  editAssignedTo: '',
  editLocation: '',
  editCategory: '',
  editEstCompletion: '',
  setEditDescription: vi.fn(),
  setEditPriority: vi.fn(),
  setEditAssignedTo: vi.fn(),
  setEditLocation: vi.fn(),
  setEditCategory: vi.fn(),
  setEditEstCompletion: vi.fn(),
  startEdit: vi.fn(),
  handleSaveEdit: vi.fn(),
  cancelEdit: vi.fn(),
  addingPart: false,
  editingPartId: null,
  partForm: {},
  partSaving: false,
  setPartForm: vi.fn(),
  startAddPart: vi.fn(),
  startEditPart: vi.fn(),
  handleSavePart: vi.fn(),
  cancelAddPart: vi.fn(),
  cancelEditPart: vi.fn(),
  handleDeletePart: vi.fn(),
  addingLabor: false,
  editingLaborId: null,
  laborForm: {},
  laborSaving: false,
  setLaborForm: vi.fn(),
  startAddLabor: vi.fn(),
  startEditLabor: vi.fn(),
  handleSaveLabor: vi.fn(),
  cancelAddLabor: vi.fn(),
  cancelEditLabor: vi.fn(),
  handleDeleteLabor: vi.fn(),
  deleteConfirm: false,
  isDeleting: false,
  setDeleteConfirm: vi.fn(),
  handleDelete: vi.fn(),
};

describe('WorkOrderDetailModal', () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWorkOrderState).mockReturnValue(DEFAULT_STATE as any);
  });

  it('renders nothing when workOrder is null', () => {
    vi.mocked(useWorkOrderState).mockReturnValue({ ...DEFAULT_STATE, wo: null } as any);
    const { container } = render(
      <WorkOrderDetailModal workOrder={null} onClose={onClose} onUpdate={onUpdate} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal with all sections when workOrder is provided', () => {
    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByTestId('wo-header')).toBeInTheDocument();
    expect(screen.getByTestId('wo-status-bar')).toBeInTheDocument();
    expect(screen.getByTestId('wo-info')).toBeInTheDocument();
    expect(screen.getByTestId('wo-parts')).toBeInTheDocument();
    expect(screen.getByTestId('wo-labor')).toBeInTheDocument();
    expect(screen.getByTestId('wo-history')).toBeInTheDocument();
  });

  it('displays work order number in header', () => {
    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );
    expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
  });

  it('calls onClose when CLOSE button is clicked', () => {
    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByText('CLOSE'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay backdrop', () => {
    const { container } = render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    // The outermost div is the backdrop overlay - it's the first child of the container
    const backdrop = container.firstElementChild!;
    // Simulate clicking the backdrop itself (e.target === e.currentTarget)
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal content', () => {
    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByTestId('wo-info'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows error bar when there is an error', () => {
    vi.mocked(useWorkOrderState).mockReturnValue({
      ...DEFAULT_STATE,
      error: 'Failed to update status',
    } as any);

    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByTestId('wo-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to update status')).toBeInTheDocument();
  });

  it('does not show error bar when error is null', () => {
    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.queryByTestId('wo-error')).not.toBeInTheDocument();
  });

  it('passes transitions to status bar', () => {
    vi.mocked(useWorkOrderState).mockReturnValue({
      ...DEFAULT_STATE,
      transitions: ['IN_PROGRESS', 'AWAITING_PARTS'],
    } as any);

    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByTestId('status-IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByTestId('status-AWAITING_PARTS')).toBeInTheDocument();
  });

  it('dismiss error calls setError(null)', () => {
    const setError = vi.fn();
    vi.mocked(useWorkOrderState).mockReturnValue({
      ...DEFAULT_STATE,
      error: 'Some error',
      setError,
    } as any);

    render(
      <WorkOrderDetailModal
        workOrder={MOCK_WORK_ORDER as any}
        onClose={onClose}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByTestId('dismiss-error'));
    expect(setError).toHaveBeenCalledWith(null);
  });
});
