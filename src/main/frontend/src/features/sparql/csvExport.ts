import type { SparqlSelectResponse } from '../../api/types';

export function formatSparqlResultsAsCsv(result: SparqlSelectResponse): string {
  if (result.columns.length === 0) {
    return '';
  }

  const header = result.columns.map(escapeCsvCell).join(',');
  const rows = result.rows.map((row) =>
    result.columns.map((column) => escapeCsvCell(row[column] ?? '')).join(',')
  );

  return [header, ...rows].join('\r\n');
}

export function downloadSparqlResultsCsv(
  result: SparqlSelectResponse,
  filename = 'sparql-results.csv'
): void {
  const csv = formatSparqlResultsAsCsv(result);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
