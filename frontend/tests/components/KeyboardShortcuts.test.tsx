import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KeyboardShortcuts from '../../src/components/common/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <KeyboardShortcuts isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders all shortcut groups when isOpen is true', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Command Palette')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('shows "Command Palette" shortcuts section with entries', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Commands mode (in palette)')).toBeInTheDocument();
  });

  it('shows "Navigation" shortcuts section with entries', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Go to Map')).toBeInTheDocument();
    expect(screen.getByText('Go to Supply')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcuts isOpen={true} onClose={onClose} />);
    // The outer overlay div is the first child
    const overlay = screen.getByText('Keyboard Shortcuts').closest('div')!.parentElement!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
