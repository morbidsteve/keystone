import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useToastStore } from '../../src/stores/toastStore';
import ToastContainer from '../../src/components/ui/ToastContainer';
import { act } from '@testing-library/react';

describe('Toast Store', () => {
  beforeEach(() => {
    // Reset the store between tests
    act(() => {
      useToastStore.setState({ toasts: [] });
    });
  });

  it('starts with an empty toast list', () => {
    const state = useToastStore.getState();
    expect(state.toasts).toEqual([]);
  });

  it('addToast adds a toast to the store', () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'Hello world',
        severity: 'success',
        duration: 60000, // long so it doesn't auto-dismiss during the test
      });
    });

    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].message).toBe('Hello world');
    expect(state.toasts[0].severity).toBe('success');
  });

  it('removeToast removes a toast by id', () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'To be removed',
        severity: 'info',
        duration: 60000,
      });
    });

    const id = useToastStore.getState().toasts[0].id;
    act(() => {
      useToastStore.getState().removeToast(id);
    });

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('limits toasts to 5 at most', () => {
    act(() => {
      for (let i = 0; i < 7; i++) {
        useToastStore.getState().addToast({
          message: `Toast ${i}`,
          severity: 'info',
          duration: 60000,
        });
      }
    });

    expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(5);
  });
});

describe('Toast Auto-Dismiss', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      useToastStore.setState({ toasts: [] });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-dismisses after the specified duration', () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'Dismissable',
        severity: 'warning',
        duration: 3000,
      });
    });

    expect(useToastStore.getState().toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});

describe('ToastContainer rendering', () => {
  beforeEach(() => {
    act(() => {
      useToastStore.setState({ toasts: [] });
    });
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders toast messages', () => {
    act(() => {
      useToastStore.getState().addToast({
        message: 'Visible toast',
        severity: 'danger',
        duration: 60000,
      });
    });

    render(<ToastContainer />);
    expect(screen.getByText('Visible toast')).toBeInTheDocument();
  });
});
