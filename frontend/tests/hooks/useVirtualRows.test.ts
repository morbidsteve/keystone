import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualRows } from '../../src/hooks/useVirtualRows';

describe('useVirtualRows', () => {
  it('returns a virtualizer instance and parentRef', () => {
    const { result } = renderHook(() => useVirtualRows({ count: 100 }));
    expect(result.current.parentRef).toBeDefined();
    expect(result.current.virtualizer).toBeDefined();
    expect(typeof result.current.virtualizer.getTotalSize).toBe('function');
    expect(typeof result.current.virtualizer.getVirtualItems).toBe('function');
  });

  it('handles empty data (count = 0)', () => {
    const { result } = renderHook(() => useVirtualRows({ count: 0 }));
    expect(result.current.virtualizer.getTotalSize()).toBe(0);
    expect(result.current.virtualizer.getVirtualItems()).toEqual([]);
  });

  it('uses custom estimateSize', () => {
    const { result } = renderHook(() =>
      useVirtualRows({ count: 10, estimateSize: 50 }),
    );
    // Total size should be count * estimateSize = 10 * 50 = 500
    expect(result.current.virtualizer.getTotalSize()).toBe(500);
  });

  it('uses default estimateSize of 36', () => {
    const { result } = renderHook(() => useVirtualRows({ count: 5 }));
    // Total size should be count * default(36) = 5 * 36 = 180
    expect(result.current.virtualizer.getTotalSize()).toBe(180);
  });
});
