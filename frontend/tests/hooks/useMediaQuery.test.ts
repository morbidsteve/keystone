import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// No external module mocks needed for this pure hook

import { useMediaQuery, useBreakpoint, useSidebarToggle } from '../../src/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;
  let matchStates: Map<string, boolean>;

  beforeEach(() => {
    listeners = new Map();
    matchStates = new Map();

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      const matches = matchStates.get(query) ?? false;

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners.get(query)!.push(handler);
          }
        }),
        removeEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            const list = listeners.get(query)!;
            const idx = list.indexOf(handler);
            if (idx >= 0) list.splice(idx, 1);
          }
        }),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fireChange(query: string, matches: boolean) {
    matchStates.set(query, matches);
    const handlers = listeners.get(query) ?? [];
    for (const handler of handlers) {
      handler({ matches, media: query } as MediaQueryListEvent);
    }
  }

  it('returns false when media query does not match', () => {
    matchStates.set('(max-width: 767px)', false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when media query matches', () => {
    matchStates.set('(max-width: 767px)', true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    matchStates.set('(max-width: 767px)', false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    act(() => {
      fireChange('(max-width: 767px)', true);
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    matchStates.set('(max-width: 767px)', false);

    // Track all created mql objects for the query
    const mqlInstances: MediaQueryList[] = [];
    const origMatchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const mql = origMatchMedia(query);
      mqlInstances.push(mql);
      return mql;
    });

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    unmount();

    // At least one of the created mql instances should have had removeEventListener called
    const removeCalled = mqlInstances.some(
      (mql) => (mql.removeEventListener as any).mock?.calls?.length > 0,
    );
    expect(removeCalled).toBe(true);
  });
});

describe('useBreakpoint', () => {
  let matchStates: Map<string, boolean>;
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;

  beforeEach(() => {
    matchStates = new Map();
    listeners = new Map();

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      const matches = matchStates.get(query) ?? false;

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') listeners.get(query)!.push(handler);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns desktop when no breakpoints match', () => {
    matchStates.set('(max-width: 767px)', false);
    matchStates.set('(min-width: 768px) and (max-width: 1024px)', false);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('desktop');
  });

  it('returns mobile when max-width 767px matches', () => {
    matchStates.set('(max-width: 767px)', true);
    matchStates.set('(min-width: 768px) and (max-width: 1024px)', false);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('mobile');
  });

  it('returns tablet when tablet breakpoint matches', () => {
    matchStates.set('(max-width: 767px)', false);
    matchStates.set('(min-width: 768px) and (max-width: 1024px)', true);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('tablet');
  });
});

describe('useSidebarToggle', () => {
  let matchStates: Map<string, boolean>;
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;

  function fireChange(query: string, matches: boolean) {
    matchStates.set(query, matches);
    const handlers = listeners.get(query) ?? [];
    for (const handler of handlers) {
      handler({ matches, media: query } as MediaQueryListEvent);
    }
  }

  beforeEach(() => {
    matchStates = new Map();
    listeners = new Map();

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);
      const matches = matchStates.get(query) ?? false;

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') listeners.get(query)!.push(handler);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      } as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sidebar is open on desktop regardless of toggle', () => {
    matchStates.set('(max-width: 767px)', false);
    const { result } = renderHook(() => useSidebarToggle());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isOpen).toBe(true);
  });

  it('sidebar is closed by default on mobile', () => {
    matchStates.set('(max-width: 767px)', true);
    const { result } = renderHook(() => useSidebarToggle());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it('toggle opens sidebar on mobile', () => {
    matchStates.set('(max-width: 767px)', true);
    const { result } = renderHook(() => useSidebarToggle());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isMobileOpen).toBe(true);
  });

  it('close function closes sidebar on mobile', () => {
    matchStates.set('(max-width: 767px)', true);
    const { result } = renderHook(() => useSidebarToggle());

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
