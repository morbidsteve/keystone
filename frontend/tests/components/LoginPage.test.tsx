import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock dependencies
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
}));

// Non-demo mode by default
vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: false,
  mockApi: {},
}));

vi.mock('../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [],
  SECTION_TITLES: {},
}));

vi.mock('../../src/stores/classificationStore', () => ({
  useClassificationStore: vi.fn((selector) => {
    const state = { fetchClassification: vi.fn() };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../../src/components/ui/ClassificationBanner', () => ({
  default: ({ position }: { position: string }) =>
    React.createElement('div', { 'data-testid': `banner-${position}` }, 'UNCLASSIFIED'),
}));

vi.mock('../../src/components/onboarding/DemoWalkthrough', () => ({
  default: () => React.createElement('div', { 'data-testid': 'demo-walkthrough' }),
}));

vi.mock('../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
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

import LoginPage from '../../src/pages/LoginPage';
import { useAuth } from '../../src/hooks/useAuth';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage (non-demo mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      token: null,
      logout: vi.fn(),
    });
  });

  it('renders KEYSTONE title', () => {
    renderLoginPage();
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
  });

  it('renders LOGISTICS COMMON OPERATING PICTURE subtitle', () => {
    renderLoginPage();
    expect(screen.getByText('LOGISTICS COMMON OPERATING PICTURE')).toBeInTheDocument();
  });

  it('renders username and password fields', () => {
    renderLoginPage();
    expect(screen.getByText('USERNAME')).toBeInTheDocument();
    expect(screen.getByText('PASSWORD')).toBeInTheDocument();
  });

  it('renders LOGIN button', () => {
    renderLoginPage();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('renders classification banners', () => {
    renderLoginPage();
    expect(screen.getByTestId('banner-top')).toBeInTheDocument();
    expect(screen.getByTestId('banner-bottom')).toBeInTheDocument();
  });

  it('LOGIN button is disabled when username is empty', () => {
    renderLoginPage();
    const loginButton = screen.getByText('LOGIN');
    expect(loginButton).toBeDisabled();
  });

  it('LOGIN button is disabled when password is empty (non-demo)', () => {
    renderLoginPage();
    const usernameInput = screen.getByRole('textbox');
    fireEvent.change(usernameInput, { target: { value: 'admin' } });

    const loginButton = screen.getByText('LOGIN');
    expect(loginButton).toBeDisabled();
  });

  it('LOGIN button is enabled when both fields are filled', () => {
    renderLoginPage();
    const inputs = screen.getAllByRole('textbox');
    // Username input
    fireEvent.change(inputs[0], { target: { value: 'admin' } });
    // Password input (type=password, not textbox role)
    const passwordInput = document.querySelector('input[type="password"]')!;
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    const loginButton = screen.getByText('LOGIN');
    expect(loginButton).not.toBeDisabled();
  });

  it('submitting form calls login with username and password', async () => {
    renderLoginPage();

    const usernameInput = screen.getAllByRole('textbox')[0];
    const passwordInput = document.querySelector('input[type="password"]')!;

    fireEvent.change(usernameInput, { target: { value: 'operator' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith('operator', 'pass123');
    });
  });

  it('displays error message when auth error exists', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
      clearError: mockClearError,
      user: null,
      token: null,
      logout: vi.fn(),
    });

    renderLoginPage();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows AUTHENTICATING... text when loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
      user: null,
      token: null,
      logout: vi.fn(),
    });

    renderLoginPage();
    expect(screen.getByText('AUTHENTICATING...')).toBeInTheDocument();
  });

  it('renders version string', () => {
    renderLoginPage();
    expect(screen.getByText(/USMC LOGISTICS INTELLIGENCE SYSTEM/)).toBeInTheDocument();
  });
});
