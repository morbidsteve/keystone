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

function renderSidebar(props: { isMobileOpen?: boolean; onClose?: () => void } = {}) {
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
      <MemoryRouter>
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
    expect(screen.getByText('OPERATIONS')).toBeInTheDocument();
    expect(screen.getByText('LOGISTICS')).toBeInTheDocument();
    // PERSONNEL appears as both a group label and a nav item; check both exist
    expect(screen.getAllByText('PERSONNEL').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('DATA')).toBeInTheDocument();
    expect(screen.getByText('SECURITY')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
  });

  it('renders navigation items within groups', () => {
    renderSidebar();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByText('MAP')).toBeInTheDocument();
    expect(screen.getByText('SUPPLY')).toBeInTheDocument();
    expect(screen.getByText('EQUIPMENT')).toBeInTheDocument();
  });

  it('renders KEYSTONE brand text', () => {
    renderSidebar();
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
  });

  it('clicking a group header collapses its items', () => {
    renderSidebar();

    // LOGISTICS group should show SUPPLY by default
    expect(screen.getByText('SUPPLY')).toBeInTheDocument();

    // Click the LOGISTICS group header to collapse it
    const logisticsHeader = screen.getByText('LOGISTICS');
    fireEvent.click(logisticsHeader);

    // After collapsing, SUPPLY should be hidden
    expect(screen.queryByText('SUPPLY')).not.toBeInTheDocument();
  });

  it('clicking a collapsed group header expands it', () => {
    renderSidebar();

    const logisticsHeader = screen.getByText('LOGISTICS');
    // Collapse
    fireEvent.click(logisticsHeader);
    expect(screen.queryByText('SUPPLY')).not.toBeInTheDocument();

    // Expand
    fireEvent.click(logisticsHeader);
    expect(screen.getByText('SUPPLY')).toBeInTheDocument();
  });

  it('renders the user info when logged in', () => {
    renderSidebar();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('shows alert badge count', () => {
    renderSidebar();
    // The mock alertStore returns unreadCount: 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
