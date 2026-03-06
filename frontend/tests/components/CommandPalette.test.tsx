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
    { username: 'testuser', full_name: 'John Doe', rank: 'Cpl', mos: '0311', billet: 'Rifleman', unit: 'Alpha Co', description: 'Test', section: 'OPERATORS' },
  ],
}));

// Mock mockData to keep tests fast and deterministic
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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when Ctrl+K is pressed', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes when Escape is pressed inside the palette', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows page results when typing a matching query', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '/dash' } });

    // Use getAllByText since "Dashboard" may appear in multiple contexts
    const matches = screen.getAllByText(/Dashboard/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('filters out non-matching pages in page mode', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByRole('combobox');
    // Use / prefix for pages-only mode so results are scoped
    fireEvent.change(input, { target: { value: '/dashboard' } });

    const matches = screen.getAllByText(/Dashboard/i);
    expect(matches.length).toBeGreaterThan(0);
    // Fuel should not appear in page-only mode filtering for "dashboard"
    expect(screen.queryByText('Fuel')).not.toBeInTheDocument();
  });

  it('navigates and closes when Enter is pressed on a page result', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByRole('combobox');
    // Use / prefix to get pages only, type "dash" to match Dashboard
    fireEvent.change(input, { target: { value: '/dash' } });

    // Press Enter to select the first result (Dashboard)
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    // Palette should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows commands when typing > prefix', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '>new' } });

    // Should show command results like "New Requisition", "New Work Order"
    const matches = screen.getAllByText(/New/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('closes when Ctrl+K is pressed while open (toggle)', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    renderPalette();
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Command palette');

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls');
  });
});
