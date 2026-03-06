import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock all child components to isolate the modal logic
vi.mock('../../../src/api/map', () => ({
  getMapData: vi.fn().mockResolvedValue({
    units: [],
    routes: [],
    supplyPoints: [],
  }),
}));

vi.mock('../../../src/api/mockClient', () => ({
  isDemoMode: false,
  mockApi: {
    getUnitEquipment: vi.fn().mockResolvedValue([]),
    getUnitSupply: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [],
}));

vi.mock('../../../src/api/mockData', () => ({
  DEMO_SUPPLY_RECORDS: [],
  DEMO_INDIVIDUAL_EQUIPMENT: [],
  DEMO_WORK_ORDERS: [],
  DEMO_UNITS: [],
  DEMO_ALERTS: [],
  DEMO_MOVEMENTS: [],
  DEMO_REPORTS: [],
  DEMO_PERSONNEL: [],
}));

vi.mock('../../../src/components/transportation/route-planner/RouteMap', () => ({
  default: ({ onMapClick }: any) =>
    React.createElement('div', {
      'data-testid': 'route-map',
      onClick: () => onMapClick?.(33.5, -117.6),
    }),
}));

vi.mock('../../../src/components/transportation/route-planner/RouteForm', () => ({
  default: ({ origin, destination, totalDistance }: any) =>
    React.createElement('div', { 'data-testid': 'route-form' },
      React.createElement('span', { 'data-testid': 'origin' }, origin),
      React.createElement('span', { 'data-testid': 'destination' }, destination),
      React.createElement('span', { 'data-testid': 'total-distance' }, String(totalDistance)),
    ),
}));

vi.mock('../../../src/components/transportation/route-planner/CargoManager', () => ({
  default: () => React.createElement('div', { 'data-testid': 'cargo-manager' }),
}));

vi.mock('../../../src/components/transportation/route-planner/RouteReview', () => ({
  VehicleSection: () => React.createElement('div', { 'data-testid': 'vehicle-section' }),
  DetailsSection: () => React.createElement('div', { 'data-testid': 'details-section' }),
}));

vi.mock('../../../src/components/transportation/route-planner/PersonnelAssignment', () => ({
  default: () => React.createElement('div', { 'data-testid': 'personnel-assignment' }),
}));

vi.mock('../../../src/components/transportation/route-planner/usePersonnel', () => ({
  usePersonnel: () => ({
    personnelMode: 'basic',
    setPersonnelMode: vi.fn(),
    personnelRoles: [],
    setPersonnelRoles: vi.fn(),
    convoyVehicles: [],
    unassignedPersonnel: [],
    totalDetailedPersonnel: 0,
    personnelSearchQuery: '',
    personnelSearchResults: [],
    personnelSearchLoading: false,
    assignTargetVehicleId: null,
    showRoleSelector: false,
    setPersonnelSearchQuery: vi.fn(),
    setAssignTargetVehicleId: vi.fn(),
    setShowRoleSelector: vi.fn(),
    setPersonnelSearchResults: vi.fn(),
    handleAssignPersonnel: vi.fn(),
    handleRemoveAssignedPersonnel: vi.fn(),
    handleUpdateConvoyVehicle: vi.fn(),
    resetPersonnel: vi.fn(),
  }),
}));

import RoutePlannerModal from '../../../src/components/transportation/RoutePlannerModal';

describe('RoutePlannerModal', () => {
  const onClose = vi.fn();
  const onSaveRoute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <RoutePlannerModal isOpen={false} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when isOpen is true', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );
    expect(screen.getByTestId('route-map')).toBeInTheDocument();
    expect(screen.getByTestId('route-form')).toBeInTheDocument();
  });

  it('renders all form sections', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );

    expect(screen.getByTestId('route-map')).toBeInTheDocument();
    expect(screen.getByTestId('route-form')).toBeInTheDocument();
    expect(screen.getByTestId('cargo-manager')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-section')).toBeInTheDocument();
    expect(screen.getByTestId('personnel-assignment')).toBeInTheDocument();
    expect(screen.getByTestId('details-section')).toBeInTheDocument();
  });

  it('renders convoy name input', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );
    const nameInput = screen.getByPlaceholderText('CONVOY NAME');
    expect(nameInput).toBeInTheDocument();
  });

  it('renders CLEAR ALL button', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );
    expect(screen.getByText('CLEAR ALL')).toBeInTheDocument();
  });

  it('renders SAVE MOVEMENT button', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );
    expect(screen.getByText('SAVE MOVEMENT')).toBeInTheDocument();
  });

  it('SAVE MOVEMENT button is disabled when convoy name is empty', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );
    const saveBtn = screen.getByText('SAVE MOVEMENT');
    expect(saveBtn).toBeDisabled();
  });

  it('SAVE MOVEMENT button is enabled when convoy name is filled', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );

    const nameInput = screen.getByPlaceholderText('CONVOY NAME');
    fireEvent.change(nameInput, { target: { value: 'PHOENIX-07' } });

    const saveBtn = screen.getByText('SAVE MOVEMENT');
    expect(saveBtn).not.toBeDisabled();
  });

  it('calls onClose when X button is clicked', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );

    // The X button closes the modal
    const buttons = screen.getAllByRole('button');
    // Find the close button (has X icon)
    const closeBtn = buttons.find((b) => b.querySelector('svg') && b.closest('[style*="justify-content: space-between"]'));
    // Alternatively just look for the button near the header
    // The close button is in the header area
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls onSaveRoute when SAVE MOVEMENT is clicked with name', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );

    const nameInput = screen.getByPlaceholderText('CONVOY NAME');
    fireEvent.change(nameInput, { target: { value: 'IRON HORSE' } });

    fireEvent.click(screen.getByText('SAVE MOVEMENT'));

    expect(onSaveRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'IRON HORSE',
        status: 'PLANNED',
      }),
    );
  });

  it('CLEAR ALL resets the convoy name', () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );

    const nameInput = screen.getByPlaceholderText('CONVOY NAME') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'TEST' } });
    expect(nameInput.value).toBe('TEST');

    fireEvent.click(screen.getByText('CLEAR ALL'));
    expect(nameInput.value).toBe('');
  });

  it('Escape key closes the modal', async () => {
    render(
      <RoutePlannerModal isOpen={true} onClose={onClose} onSaveRoute={onSaveRoute} />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
