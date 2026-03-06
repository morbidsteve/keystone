import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportMenu from '../../src/components/common/ExportMenu';

// Mock the export lib to avoid jsPDF/DOM side effects
vi.mock('../../src/lib/export', () => ({
  exportToCSV: vi.fn(),
  exportToPDF: vi.fn(),
}));

const defaultProps = {
  data: [{ id: 1, name: 'Alpha' }],
  filename: 'test-export',
  title: 'Test Export',
};

describe('ExportMenu', () => {
  it('renders the export button', () => {
    render(<ExportMenu {...defaultProps} />);
    expect(screen.getByTitle('Export data')).toBeInTheDocument();
    expect(screen.getByText('EXPORT')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<ExportMenu {...defaultProps} />);
    const button = screen.getByText('EXPORT');
    fireEvent.click(button);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
  });

  it('has CSV and PDF options', () => {
    render(<ExportMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('EXPORT'));
    const csvBtn = screen.getByText('Export CSV');
    const pdfBtn = screen.getByText('Export PDF');
    expect(csvBtn.tagName).toBe('BUTTON');
    expect(pdfBtn.tagName).toBe('BUTTON');
  });

  it('closes dropdown after CSV click', async () => {
    const { exportToCSV } = await import('../../src/lib/export');
    render(<ExportMenu {...defaultProps} />);
    fireEvent.click(screen.getByText('EXPORT'));
    fireEvent.click(screen.getByText('Export CSV'));
    expect(exportToCSV).toHaveBeenCalled();
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
  });
});
