import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from '../../src/components/common/CommandPalette';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the API modules to avoid import issues
vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: true,
}));

vi.mock('../../src/api/client', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [
    { username: 'testuser', full_name: 'John Doe', rank: 'Cpl', mos: '0311', billet: 'Rifleman', unit: 'Alpha Co' },
  ],
}));

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

function renderPalette() {
  return render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('is NOT visible by default', () => {
    renderPalette();
    expect(screen.queryByPlaceholderText(/search pages/i)).not.toBeInTheDocument();
  });

  it('opens when Ctrl+K is pressed', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByPlaceholderText(/search pages/i)).toBeInTheDocument();
  });

  it('closes when Escape is pressed inside the palette', () => {
    renderPalette();
    // Open the palette
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByPlaceholderText(/search pages/i);
    expect(input).toBeInTheDocument();

    // Press Escape on the palette container (onKeyDown handler)
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByPlaceholderText(/search pages/i)).not.toBeInTheDocument();
  });

  it('shows page results when typing a matching query', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'dash' } });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('filters out non-matching pages', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'dashboard' } });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // "Fuel" should not match "dashboard"
    expect(screen.queryByText('Fuel')).not.toBeInTheDocument();
  });

  it('navigates and closes when Enter is pressed on a result', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(input, { target: { value: 'dash' } });

    // Press Enter to select the first result (Dashboard)
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    // Palette should close
    expect(screen.queryByPlaceholderText(/search pages/i)).not.toBeInTheDocument();
  });

  it('arrow down changes selected index', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByPlaceholderText(/search pages/i);

    // With no query, all pages are listed. Press ArrowDown to move selection.
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Now press Enter — it should navigate to the second page item (Map)
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/map');
  });

  it('closes when Ctrl+K is pressed while open (toggle)', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByPlaceholderText(/search pages/i)).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.queryByPlaceholderText(/search pages/i)).not.toBeInTheDocument();
  });
});
