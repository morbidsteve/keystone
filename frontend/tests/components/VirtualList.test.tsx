import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VirtualList from '../../src/components/ui/VirtualList';

// Mock @tanstack/react-virtual to avoid complex virtualizer internals in jsdom
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(({ count }: { count: number }) => ({
    getTotalSize: () => count * 40,
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        key: i,
        index: i,
        start: i * 40,
        size: 40,
      })),
  })),
}));

describe('VirtualList', () => {
  it('renders with items', () => {
    const items = ['Item A', 'Item B', 'Item C'];
    render(
      <VirtualList
        items={items}
        height={200}
        estimateSize={40}
        renderItem={(item) => <span>{item}</span>}
      />,
    );
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('Item C')).toBeInTheDocument();
  });

  it('only renders visible items (not all)', () => {
    const items = Array.from({ length: 100 }, (_, i) => `Row ${i}`);
    render(
      <VirtualList
        items={items}
        height={200}
        estimateSize={40}
        renderItem={(item) => <span>{item}</span>}
      />,
    );
    // The mock limits to 10 items rendered
    expect(screen.getByText('Row 0')).toBeInTheDocument();
    expect(screen.getByText('Row 9')).toBeInTheDocument();
    // Items beyond the virtual window should not be rendered
    expect(screen.queryByText('Row 50')).not.toBeInTheDocument();
  });

  it('has proper list roles for accessibility', () => {
    const items = ['Alpha', 'Bravo'];
    render(
      <VirtualList
        items={items}
        height={200}
        estimateSize={40}
        renderItem={(item) => <span>{item}</span>}
      />,
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(2);
  });

  it('handles empty items array', () => {
    const { container } = render(
      <VirtualList
        items={[]}
        height={200}
        estimateSize={40}
        renderItem={(item: string) => <span>{item}</span>}
      />,
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    // Container should still have the list wrapper
    expect(container.firstChild).toBeTruthy();
  });
});
