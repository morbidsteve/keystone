import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import Header from '../../src/components/layout/Header';
import { useAuthStore } from '../../src/stores/authStore';
import { useDashboardStore } from '../../src/stores/dashboardStore';
import { useHelpModeStore } from '../../src/hooks/useHelpMode';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/dashboard' }) };
});

// Mock API modules to avoid import issues
vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: false,
}));

vi.mock('../../src/api/client', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [],
}));

vi.mock('../../src/api/mockData', () => ({
  DEMO_SUPPLY_RECORDS: [],
  DEMO_INDIVIDUAL_EQUIPMENT: [],
  DEMO_WORK_ORDERS: [],
  DEMO_UNITS: [],
  DEMO_ALERTS: [],
  DEMO_MOVEMENTS: [],
  DEMO_REPORTS: [],
  DEMO_PERSONNEL: [],
}));

vi.mock('../../src/api/requisitions', () => ({
  getRequisitions: vi.fn().mockResolvedValue([]),
}));

// Mock QuickActionsButton to avoid deep dependency tree
vi.mock('../../src/components/common/QuickActionsButton', () => ({
  default: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

// Mock GuidedTour
vi.mock('../../src/components/onboarding/GuidedTour', () => ({
  resetGuidedTour: vi.fn(),
}));

vi.mock('../../src/stores/alertStore', () => ({
  useAlertStore: vi.fn((selector) => {
    const state = { alerts: [], unreadCount: 5, isLoading: false, error: null };
    return selector(state);
  }),
}));

function renderHeader() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Header onMenuToggle={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    act(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'testadmin',
          full_name: 'Test Admin',
          role: 'admin',
          unit_id: 1,
          email: 'test@test.com',
          is_active: true,
        },
        token: 'fake-token',
        permissions: ['*'],
      });
      useDashboardStore.setState({ timeRange: '24h' });
      useHelpModeStore.setState({ isHelpMode: false });
    });
  });

  it('renders header with page title', () => {
    renderHeader();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });

  it('renders header with banner role', () => {
    renderHeader();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('shows user info when logged in', () => {
    renderHeader();
    expect(screen.getByText('testadmin')).toBeInTheDocument();
  });

  it('toggles help mode when help button clicked', () => {
    renderHeader();
    const helpButton = screen.getByLabelText('Enable help mode');
    fireEvent.click(helpButton);
    // After clicking, the help mode store should have toggled
    expect(useHelpModeStore.getState().isHelpMode).toBe(true);
  });

  it('opens user dropdown menu on click', () => {
    renderHeader();
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    // Dropdown should now be visible with menu role
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('shows notification bell with badge count', () => {
    renderHeader();
    // unreadCount is 5 from mock
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('Alerts, 5 unread')).toBeInTheDocument();
  });

  it('renders time range selector buttons', () => {
    renderHeader();
    expect(screen.getByText('24H')).toBeInTheDocument();
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
  });

  it('"Restart Tour" button appears in user dropdown', () => {
    renderHeader();
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    expect(screen.getByText('RESTART TOUR')).toBeInTheDocument();
  });
});
