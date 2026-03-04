import { useState, useEffect, useCallback } from 'react';

/**
 * Returns true when the viewport matches the given media query string.
 * Example: useMediaQuery('(max-width: 767px)') => true on mobile.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Convenience: returns 'mobile' | 'tablet' | 'desktop'.
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/**
 * Manages sidebar open/close state with automatic behavior per breakpoint.
 * On mobile: sidebar is closed by default, toggled via hamburger.
 * On tablet/desktop: sidebar is always visible (state is ignored).
 */
export function useSidebarToggle() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when switching away from mobile
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  return {
    isMobile,
    isOpen: isMobile ? isOpen : true,
    isMobileOpen: isMobile && isOpen,
    toggle,
    close,
    open,
  };
}
