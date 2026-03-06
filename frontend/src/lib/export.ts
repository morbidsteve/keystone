import { jsPDF } from 'jspdf';

/**
 * CSV export — takes array of objects, generates CSV string, triggers download.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; header: string }[],
): void {
  if (data.length === 0) return;

  const cols = columns ?? Object.keys(data[0]).map((k) => ({ key: k, header: k }));

  const escapeCSV = (value: unknown): string => {
    const str = value == null ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = cols.map((c) => escapeCSV(c.header)).join(',');
  const rows = data.map((row) =>
    cols.map((c) => escapeCSV(row[c.key])).join(','),
  );

  const csv = [headerRow, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * PDF export — takes array of objects, generates simple table PDF via jsPDF.
 */
export function exportToPDF(
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  columns?: { key: string; header: string }[],
): void {
  if (data.length === 0) return;

  const cols = columns ?? Object.keys(data[0]).map((k) => ({ key: k, header: k }));

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const colWidth = (pageWidth - margin * 2) / cols.length;
  const rowHeight = 18;
  const headerHeight = 22;

  // Title
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), margin, margin);

  // Timestamp
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 16);
  doc.setTextColor(0);

  let y = margin + 36;

  const drawHeader = () => {
    doc.setFillColor(40, 40, 50);
    doc.rect(margin, y, pageWidth - margin * 2, headerHeight, 'F');
    doc.setFontSize(7);
    doc.setTextColor(200);
    cols.forEach((col, i) => {
      doc.text(
        col.header.toUpperCase(),
        margin + i * colWidth + 4,
        y + 14,
      );
    });
    doc.setTextColor(0);
    y += headerHeight;
  };

  drawHeader();

  doc.setFontSize(7);
  data.forEach((row) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setFontSize(7);
    }

    // Alternating row background
    if (Math.round((y - margin) / rowHeight) % 2 === 0) {
      doc.setFillColor(245, 245, 248);
      doc.rect(margin, y, pageWidth - margin * 2, rowHeight, 'F');
    }

    cols.forEach((col, i) => {
      const val = row[col.key];
      const text = val == null ? '' : String(val);
      // Truncate long text to fit column
      const maxChars = Math.floor(colWidth / 4);
      const truncated = text.length > maxChars ? text.slice(0, maxChars - 1) + '\u2026' : text;
      doc.text(truncated, margin + i * colWidth + 4, y + 12);
    });

    y += rowHeight;
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
