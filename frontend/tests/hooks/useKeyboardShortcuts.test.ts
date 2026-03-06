import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock modal store
vi.mock('../../src/stores/modalStore', () => ({
  useModalStore: vi.fn((selector) => {
    const state = { activeModal: null, openModal: vi.fn(), closeModal: vi.fn() };
    return selector(state);
  }),
}));

// Mock API modules
vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: true,
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

import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('returns showHelp state and setShowHelp', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current).toHaveProperty('showHelp');
    expect(result.current).toHaveProperty('setShowHelp');
  });

  it('showHelp is false initially', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current.showHelp).toBe(false);
  });

  it('setShowHelp(true) updates state', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    act(() => {
      result.current.setShowHelp(true);
    });
    expect(result.current.showHelp).toBe(true);
  });

  it('"?" key press toggles showHelp to true', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current.showHelp).toBe(false);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', bubbles: true }),
      );
    });
    expect(result.current.showHelp).toBe(true);
  });

  it('"?" key press toggles showHelp back to false', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    // Toggle on
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', bubbles: true }),
      );
    });
    expect(result.current.showHelp).toBe(true);

    // Toggle off
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', bubbles: true }),
      );
    });
    expect(result.current.showHelp).toBe(false);
  });
});
