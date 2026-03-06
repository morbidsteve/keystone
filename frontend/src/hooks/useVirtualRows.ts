import { useRef } from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';

interface UseVirtualRowsOptions {
  count: number;
  estimateSize?: number;
  overscan?: number;
}

interface UseVirtualRowsResult {
  parentRef: React.RefObject<HTMLDivElement>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
}

/**
 * Hook for virtualizing table rows. Works with existing <table> structure.
 *
 * Usage:
 *   const { parentRef, virtualizer } = useVirtualRows({ count: rows.length });
 *
 *   <div ref={parentRef} style={{ height: 500, overflow: 'auto' }}>
 *     <table>
 *       <thead>...</thead>
 *       <tbody style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
 *         {virtualizer.getVirtualItems().map(virtualRow => {
 *           const row = rows[virtualRow.index];
 *           return (
 *             <tr key={row.id}
 *                 style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)`, width: '100%' }}>
 *               ...
 *             </tr>
 *           );
 *         })}
 *       </tbody>
 *     </table>
 *   </div>
 */
export function useVirtualRows({
  count,
  estimateSize = 36,
  overscan = 10,
}: UseVirtualRowsOptions): UseVirtualRowsResult {
  const parentRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return { parentRef, virtualizer };
}
