import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingFallback from '../../src/components/ui/LoadingFallback';

describe('LoadingFallback', () => {
  it('renders without errors', () => {
    const { container } = render(<LoadingFallback />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows "Loading..." text', () => {
    render(<LoadingFallback />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders loading spinner element', () => {
    const { container } = render(<LoadingFallback />);
    // The spinner is the first child div inside the wrapper
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    // Should have two children: spinner div and "Loading..." text
    expect(wrapper.childNodes.length).toBeGreaterThanOrEqual(2);
  });
});
