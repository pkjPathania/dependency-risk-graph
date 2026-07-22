import { describe, expect, it } from 'vitest';
import { formatSparqlResultsAsCsv } from './csvExport';

describe('formatSparqlResultsAsCsv', () => {
  it('includes ordered column headers and rows', () => {
    expect(
      formatSparqlResultsAsCsv({
        columns: ['application', 'version'],
        rows: [
          { application: 'service-a', version: '1.0.0' },
          { application: 'service-b', version: '2.0.0' }
        ]
      })
    ).toBe('application,version\r\nservice-a,1.0.0\r\nservice-b,2.0.0');
  });

  it('escapes commas, quotes, line breaks, headers, and missing values', () => {
    expect(
      formatSparqlResultsAsCsv({
        columns: ['package,name', 'details'],
        rows: [
          { 'package,name': 'library "core"', details: 'first line\nsecond line' },
          { 'package,name': 'library-api' }
        ]
      })
    ).toBe(
      '"package,name",details\r\n"library ""core""","first line\nsecond line"\r\nlibrary-api,'
    );
  });

  it('returns an empty document when the response has no columns', () => {
    expect(formatSparqlResultsAsCsv({ columns: [], rows: [] })).toBe('');
  });
});
