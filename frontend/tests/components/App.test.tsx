import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';

function renderWithProviders(initialRoute = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders login page when not authenticated', async () => {
    renderWithProviders('/login');
    expect(await screen.findByText('KEYSTONE')).toBeInTheDocument();
    expect(await screen.findByText('LOGISTICS COMMON OPERATING PICTURE')).toBeInTheDocument();
  });

  it('renders login page content', async () => {
    renderWithProviders('/login');
    // Wait for the lazy-loaded LoginPage to render
    await waitFor(() => {
      const hasRolePicker = screen.queryByText(/SELECT YOUR ROLE/) !== null;
      const hasLoginForm = screen.queryByText('USERNAME') !== null;
      expect(hasRolePicker || hasLoginForm).toBe(true);
    });
  });

  it('renders classification banners', async () => {
    renderWithProviders('/login');
    await waitFor(() => {
      const banners = screen.getAllByText('UNCLASSIFIED');
      expect(banners.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('redirects to login when accessing protected route without auth', async () => {
    localStorage.removeItem('keystone_token');
    localStorage.removeItem('keystone_user');
    renderWithProviders('/dashboard');
    expect(await screen.findByText('KEYSTONE')).toBeInTheDocument();
    // In demo mode role picker shows KEYSTONE, otherwise LOGIN button
    await waitFor(() => {
      const hasRolePicker = screen.queryByText(/SELECT YOUR ROLE/) !== null;
      const hasLoginButton = screen.queryByText('LOGIN') !== null;
      expect(hasRolePicker || hasLoginButton).toBe(true);
    });
  });
});
