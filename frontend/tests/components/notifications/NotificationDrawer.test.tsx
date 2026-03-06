import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationDrawer from '../../../src/components/notifications/NotificationDrawer';
import { AlertSeverity } from '../../../src/lib/types';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock alertStore
const mockAcknowledgeAlert = vi.fn();
vi.mock('../../../src/stores/alertStore', () => ({
  useAlertStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      alerts: [
        {
          id: 'a1',
          type: 'SUPPLY_LOW',
          severity: AlertSeverity.CRITICAL,
          unitId: 'u1',
          unitName: '1ST BN',
          title: 'Low Ammo',
          message: 'Class V below threshold',
          acknowledged: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'a2',
          type: 'EQUIPMENT_DEADLINE',
          severity: AlertSeverity.WARNING,
          unitId: 'u2',
          unitName: '2ND BN',
          title: 'Vehicle Down',
          message: 'HMMWV deadline',
          acknowledged: false,
          createdAt: new Date().toISOString(),
        },
      ],
      acknowledgeAlert: mockAcknowledgeAlert,
    };
    return selector(state);
  }),
}));

describe('NotificationDrawer', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    mockNavigate.mockClear();
    mockAcknowledgeAlert.mockClear();
  });

  it('renders when open', () => {
    render(<NotificationDrawer open={true} onClose={onClose} />);
    expect(screen.getByText('NOTIFICATIONS')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<NotificationDrawer open={false} onClose={onClose} />);
    expect(screen.queryByText('NOTIFICATIONS')).not.toBeInTheDocument();
  });

  it('shows alert items', () => {
    render(<NotificationDrawer open={true} onClose={onClose} />);
    expect(screen.getByText('Low Ammo')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Down')).toBeInTheDocument();
    expect(screen.getByText('Class V below threshold')).toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    render(<NotificationDrawer open={true} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Close notifications');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows VIEW ALL ALERTS button', () => {
    render(<NotificationDrawer open={true} onClose={onClose} />);
    expect(screen.getByText('VIEW ALL ALERTS')).toBeInTheDocument();
  });

  it('shows MARK ALL READ button when there are unread alerts', () => {
    render(<NotificationDrawer open={true} onClose={onClose} />);
    expect(screen.getByText('MARK ALL READ')).toBeInTheDocument();
  });
});
