import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/authStore';
import { act } from '@testing-library/react';
import Sidebar from '../../src/components/layout/Sidebar';

// Mock stores/hooks that Sidebar depends on
vi.mock('../../src/stores/alertStore', () => ({
  useAlertStore: vi.fn((selector) => {
    const state = { alerts: [], unreadCount: 3, isLoading: false, error: null };
    return selector(state);
  }),
}));

vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: true,
}));

vi.mock('../../src/api/requisitions', () => ({
  getRequisitions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/components/common/UnitSelector', () => ({
  default: () => <div data-testid="unit-selector">Unit Selector</div>,
}));

function renderSidebar(props: { isMobileOpen?: boolean; onClose?: () => void } = {}, initialRoute = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // Set up auth store with admin user (sees all nav items)
  act(() => {
    useAuthStore.setState({
      user: {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        role: 'admin',
        unit_id: 1,
        email: 'a@b.com',
        is_active: true,
      },
      token: 'fake-token',
      permissions: ['*'],
    });
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Sidebar
          isMobileOpen={props.isMobileOpen ?? false}
          onClose={props.onClose ?? vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all navigation group labels', () => {
    renderSidebar();
    // Group headers are always visible regardless of collapse state
    expect(screen.getByText('OPERATIONS')).toBeInTheDocument();
    expect(screen.getByText('LOGISTICS')).toBeInTheDocument();
    // PERSONNEL appears as both a group label and possibly a nav item
    expect(screen.getAllByText('PERSONNEL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('DATA')).toBeInTheDocument();
    expect(screen.getByText('SECURITY')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
  });

  it('renders navigation items within the active group', () => {
    // Route is /dashboard which is in OPERATIONS group — that group should be expanded
    renderSidebar();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByText('MAP')).toBeInTheDocument();
    expect(screen.getByText('READINESS')).toBeInTheDocument();
  });

  it('renders KEYSTONE brand text', () => {
    renderSidebar();
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
  });

  it('clicking a group header expands it to show items', () => {
    renderSidebar();

    // LOGISTICS group should be collapsed by default (not the active group)
    // Its items should not be visible
    expect(screen.queryByText('SUPPLY')).not.toBeInTheDocument();

    // Click LOGISTICS header to expand it
    const logisticsHeader = screen.getByText('LOGISTICS');
    fireEvent.click(logisticsHeader);

    // After expanding, SUPPLY should be visible
    expect(screen.getByText('SUPPLY')).toBeInTheDocument();
  });

  it('clicking an expanded group header collapses it', () => {
    renderSidebar();

    // OPERATIONS is the active group and should be expanded
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();

    // Click OPERATIONS header to collapse it
    const operationsHeader = screen.getByText('OPERATIONS');
    fireEvent.click(operationsHeader);

    // After collapsing, DASHBOARD should be hidden
    expect(screen.queryByText('DASHBOARD')).not.toBeInTheDocument();
  });

  it('renders the user info when logged in', () => {
    renderSidebar();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    // Role text (rendered lowercase from user.role)
    const roleElements = screen.getAllByText('admin');
    expect(roleElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows alert badge count in the alerts nav item', () => {
    renderSidebar();
    // Expand SECURITY group first to see ALERTS
    const securityHeader = screen.getByText('SECURITY');
    fireEvent.click(securityHeader);
    // The mock alertStore returns unreadCount: 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
