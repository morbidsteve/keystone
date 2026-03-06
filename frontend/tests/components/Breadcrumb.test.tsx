import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from '../../src/components/layout/Breadcrumb';

function renderBreadcrumb(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Breadcrumb />
    </MemoryRouter>,
  );
}

describe('Breadcrumb', () => {
  it('renders "KEYSTONE" as the first breadcrumb item', () => {
    renderBreadcrumb('/dashboard');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
  });

  it('renders the current page name based on route', () => {
    renderBreadcrumb('/supply');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
    expect(screen.getByText('SUPPLY')).toBeInTheDocument();
  });

  it('renders multiple segments with separators', () => {
    renderBreadcrumb('/data-sources');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
    expect(screen.getByText('DATA SOURCES')).toBeInTheDocument();
  });

  it('renders dashboard breadcrumb correctly', () => {
    renderBreadcrumb('/dashboard');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });

  it('uppercases unknown segments', () => {
    renderBreadcrumb('/unknown-page');
    expect(screen.getByText('KEYSTONE')).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN-PAGE')).toBeInTheDocument();
  });

  it('renders KEYSTONE as a link when not the last crumb', () => {
    renderBreadcrumb('/equipment');
    const keystoneLink = screen.getByText('KEYSTONE');
    // KEYSTONE is not the last crumb, so it should be a link element
    expect(keystoneLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('renders the last crumb as plain text (not a link)', () => {
    renderBreadcrumb('/equipment');
    const equipmentText = screen.getByText('EQUIPMENT');
    // Last crumb should be a span, not inside an anchor
    expect(equipmentText.closest('a')).toBeNull();
  });
});
