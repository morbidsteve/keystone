import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jsPDF before importing the module under test
const mockText = vi.fn();
const mockSave = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockRect = vi.fn();
const mockAddPage = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    text: mockText,
    save: mockSave,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setFillColor: mockSetFillColor,
    rect: mockRect,
    addPage: mockAddPage,
    internal: {
      pageSize: {
        getWidth: () => 841.89,
        getHeight: () => 595.28,
      },
    },
  })),
}));

// Mock DOM APIs used by exportToCSV
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// URL.createObjectURL/revokeObjectURL don't exist in jsdom — define them
globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

beforeEach(() => {
  mockClick.mockClear();
  mockAppendChild.mockClear();
  mockRemoveChild.mockClear();
  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    download: '',
    click: mockClick,
  } as unknown as HTMLElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
  vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
});

import { exportToCSV, exportToPDF } from '../../src/lib/export';

describe('exportToCSV', () => {
  it('generates correct CSV and triggers download', () => {
    const data = [
      { name: 'Alpha', count: 10 },
      { name: 'Bravo', count: 20 },
    ];
    exportToCSV(data, 'test');
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockAppendChild).toHaveBeenCalledTimes(1);
    expect(mockRemoveChild).toHaveBeenCalledTimes(1);
  });

  it('handles data with commas and quotes (escaping)', () => {
    // We need to verify the Blob content. Let's spy on the Blob constructor.
    const blobSpy = vi.spyOn(globalThis, 'Blob').mockImplementation(
      (parts) => ({ parts, size: 0, type: '' } as unknown as Blob),
    );

    const data = [
      { desc: 'Hello, world', note: 'She said "hi"' },
    ];
    exportToCSV(data, 'escaped');

    expect(blobSpy).toHaveBeenCalledTimes(1);
    const csvContent = (blobSpy.mock.calls[0][0] as string[])[0];
    // Commas in value should be quoted
    expect(csvContent).toContain('"Hello, world"');
    // Double-quotes should be escaped as ""
    expect(csvContent).toContain('"She said ""hi"""');

    blobSpy.mockRestore();
  });

  it('does nothing for empty data', () => {
    mockClick.mockClear();
    exportToCSV([], 'empty');
    expect(mockClick).not.toHaveBeenCalled();
  });
});

describe('exportToPDF', () => {
  it('does not throw and calls save', () => {
    const data = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Bravo' },
    ];
    expect(() => exportToPDF(data, 'test', 'Test Report')).not.toThrow();
    expect(mockSave).toHaveBeenCalledWith('test.pdf');
  });

  it('does nothing for empty data', () => {
    mockSave.mockClear();
    exportToPDF([], 'empty', 'Empty Report');
    expect(mockSave).not.toHaveBeenCalled();
  });
});
