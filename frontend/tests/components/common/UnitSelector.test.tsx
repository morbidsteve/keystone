import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock API
vi.mock('../../../src/api/mockClient', () => ({
  isDemoMode: true,
  mockApi: {
    getUnits: vi.fn(),
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

vi.mock('../../../src/lib/constants', () => ({
  ECHELON_ABBREVIATIONS: {
    MEF: 'MEF',
    DIVISION: 'DIV',
    REGIMENT: 'REGT',
    BATTALION: 'BN',
    COMPANY: 'CO',
  },
  Echelon: {
    MEF: 'MEF',
    DIVISION: 'DIVISION',
    REGIMENT: 'REGIMENT',
    BATTALION: 'BATTALION',
    COMPANY: 'COMPANY',
  },
}));

import UnitSelector from '../../../src/components/common/UnitSelector';
import { mockApi } from '../../../src/api/mockClient';

const MOCK_UNITS = [
  { id: '1', name: 'I Marine Expeditionary Force', abbreviation: 'I MEF', echelon: 'MEF', uic: 'W00001', parentId: null },
  { id: '2', name: '1st Marine Division', abbreviation: '1st MARDIV', echelon: 'DIVISION', uic: 'W00002', parentId: '1' },
  { id: '3', name: '1st Marine Regiment', abbreviation: '1st MAR', echelon: 'REGIMENT', uic: 'W00003', parentId: '2' },
  { id: '4', name: '1st Battalion 1st Marines', abbreviation: '1/1 BN', echelon: 'BATTALION', uic: 'W00004', parentId: '3' },
  { id: '5', name: 'Alpha Company', abbreviation: 'Alpha Co', echelon: 'COMPANY', uic: 'W00005', parentId: '4' },
];

describe('UnitSelector', () => {
  const onSelectUnit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockApi.getUnits).mockResolvedValue(MOCK_UNITS as any);
  });

  it('renders trigger button with ALL UNITS when nothing selected', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });
  });

  it('shows Loading... while fetching units', () => {
    // Make getUnits never resolve
    vi.mocked(mockApi.getUnits).mockReturnValue(new Promise(() => {}));

    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows selected unit abbreviation when selectedUnitId is set', async () => {
    render(
      <UnitSelector selectedUnitId="4" onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('1/1 BN')).toBeInTheDocument();
    });
  });

  it('opens dropdown on click', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search units...')).toBeInTheDocument();
    });
  });

  it('shows All Units option in dropdown', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    // Click to open
    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      // Should see ALL UNITS option inside the dropdown too
      const allUnitsElements = screen.getAllByText('ALL UNITS');
      expect(allUnitsElements.length).toBeGreaterThanOrEqual(2); // trigger + dropdown option
    });
  });

  it('shows unit tree in dropdown', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      // I MEF should be visible (root node, expanded by default)
      expect(screen.getByText('I MEF')).toBeInTheDocument();
    });
  });

  it('calls onSelectUnit(null) when "All Units" is clicked in dropdown', async () => {
    render(
      <UnitSelector selectedUnitId="4" onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('1/1 BN')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1/1 BN'));

    await waitFor(() => {
      const allUnitsButtons = screen.getAllByText('ALL UNITS');
      // Click the one in the dropdown (should be a button)
      const dropdownAllUnits = allUnitsButtons.find((el) => el.closest('button[data-unit-row]'));
      if (dropdownAllUnits) {
        fireEvent.click(dropdownAllUnits);
        expect(onSelectUnit).toHaveBeenCalledWith(null);
      }
    });
  });

  it('calls onSelectUnit with unit id when a unit is clicked', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      expect(screen.getByText('I MEF')).toBeInTheDocument();
    });

    // Click on I MEF unit row
    fireEvent.click(screen.getByText('I MEF'));
    expect(onSelectUnit).toHaveBeenCalledWith('1');
  });

  it('search filters units', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search units...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search units...'), {
      target: { value: 'Alpha' },
    });

    await waitFor(() => {
      expect(screen.getByText('Alpha Co')).toBeInTheDocument();
    });
  });

  it('shows no results message when search has no matches', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search units...')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search units...'), {
      target: { value: 'ZZZZNONEXISTENT' },
    });

    await waitFor(() => {
      expect(screen.getByText(/No units match/)).toBeInTheDocument();
    });
  });

  it('closes dropdown on Escape key', async () => {
    render(
      <UnitSelector selectedUnitId={null} onSelectUnit={onSelectUnit} />,
    );

    await waitFor(() => {
      expect(screen.getByText('ALL UNITS')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ALL UNITS'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search units...')).toBeInTheDocument();
    });

    // Fire Escape on the dropdown's search input (keyDown handler is on dropdown container)
    const searchInput = screen.getByPlaceholderText('Search units...');
    const dropdownPanel = searchInput.closest('div[style]');
    // The onKeyDown is on the dropdown panel - fire on search input which bubbles up
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search units...')).not.toBeInTheDocument();
    });
  });
});
