import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  it('renders login page when not authenticated', () => {
    renderWithProviders('/login');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
    expect(screen.getByText('LOGISTICS COMMON OPERATING PICTURE')).toBeInTheDocument();
  });

  it('renders login form elements', () => {
    renderWithProviders('/login');
    expect(screen.getByText('USERNAME')).toBeInTheDocument();
    expect(screen.getByText('PASSWORD')).toBeInTheDocument();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('renders classification banners', () => {
    renderWithProviders('/login');
    const banners = screen.getAllByText('UNCLASSIFIED');
    expect(banners.length).toBeGreaterThanOrEqual(1);
  });

  it('redirects to login when accessing protected route without auth', () => {
    localStorage.removeItem('keystone_token');
    localStorage.removeItem('keystone_user');
    renderWithProviders('/dashboard');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });
});
