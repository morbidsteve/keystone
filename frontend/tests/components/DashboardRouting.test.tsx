import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores/authStore';
import { useDashboardStore } from '../../src/stores/dashboardStore';
import DashboardPage from '../../src/pages/DashboardPage';
import { act } from '@testing-library/react';

// Mock all dashboard sub-views to simple stubs to avoid deep dependency chains
vi.mock('../../src/components/dashboard/CommanderView', () => ({
  default: () => <div data-testid="commander-view">Commander View</div>,
}));
vi.mock('../../src/components/dashboard/S4View', () => ({
  default: () => <div data-testid="s4-view">S4 View</div>,
}));
vi.mock('../../src/components/dashboard/S3View', () => ({
  default: () => <div data-testid="s3-view">S3 View</div>,
}));
vi.mock('../../src/components/dashboard/OperatorDashboard', () => ({
  default: () => <div data-testid="operator-view">Operator View</div>,
}));
vi.mock('../../src/components/dashboard/ViewerDashboard', () => ({
  default: () => <div data-testid="viewer-view">Viewer View</div>,
}));
vi.mock('../../src/components/dashboard/ActivityFeed', () => ({
  default: () => <div data-testid="activity-feed">Activity Feed</div>,
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage role-based routing', () => {
  beforeEach(() => {
    // Reset stores to defaults
    act(() => {
      useDashboardStore.setState({ activeView: 'commander' });
    });
  });

  it('Commander role sees Commander view by default', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 1, username: 'cdr', full_name: 'CDR Test', role: 'COMMANDER', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: [],
      });
    });

    renderDashboard();
    expect(screen.getByTestId('commander-view')).toBeInTheDocument();
  });

  it('Commander role sees tab switcher with COMMANDER, S-4, and S-3 tabs', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 1, username: 'cdr', full_name: 'CDR Test', role: 'COMMANDER', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: [],
      });
    });

    renderDashboard();
    expect(screen.getByText('COMMANDER')).toBeInTheDocument();
    expect(screen.getByText('S-4 (LOGISTICS)')).toBeInTheDocument();
    expect(screen.getByText('S-3 (OPERATIONS)')).toBeInTheDocument();
  });

  it('ADMIN role also sees tab switcher', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 2, username: 'admin', full_name: 'Admin User', role: 'ADMIN', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: ['*'],
      });
    });

    renderDashboard();
    expect(screen.getByText('COMMANDER')).toBeInTheDocument();
    expect(screen.getByText('S-4 (LOGISTICS)')).toBeInTheDocument();
  });

  it('S4 role sees S4 view and no tab switcher', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 3, username: 's4', full_name: 'S4 Test', role: 'S4', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: [],
      });
    });

    renderDashboard();
    expect(screen.getByTestId('s4-view')).toBeInTheDocument();
    // No tab switcher for S4
    expect(screen.queryByText('COMMANDER')).not.toBeInTheDocument();
  });

  it('VIEWER role sees viewer view and no tab switcher', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 5, username: 'viewer', full_name: 'Viewer Test', role: 'VIEWER', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: [],
      });
    });

    renderDashboard();
    expect(screen.getByTestId('viewer-view')).toBeInTheDocument();
    expect(screen.queryByText('COMMANDER')).not.toBeInTheDocument();
  });

  it('OPERATOR role sees operator view', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 6, username: 'op', full_name: 'Operator Test', role: 'OPERATOR', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: [],
      });
    });

    renderDashboard();
    expect(screen.getByTestId('operator-view')).toBeInTheDocument();
  });

  it('always renders ActivityFeed', () => {
    act(() => {
      useAuthStore.setState({
        user: { id: 1, username: 'cdr', full_name: 'CDR Test', role: 'COMMANDER', unit_id: 1, email: 'a@b.com', is_active: true },
        token: 'fake-token',
        permissions: [],
      });
    });

    renderDashboard();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
  });
});
