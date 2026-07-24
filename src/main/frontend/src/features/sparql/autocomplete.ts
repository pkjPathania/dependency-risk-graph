export interface SparqlCompletion {
  label: string;
  source: 'Query term' | 'SPARQL';
}

export interface CompletionEdit {
  value: string;
  cursorOffset: number;
}

const SPARQL_KEYWORDS = [
  'SELECT',
  'WHERE',
  'PREFIX',
  'OPTIONAL',
  'FILTER',
  'DISTINCT',
  'ORDER BY',
  'GROUP BY',
  'LIMIT',
  'OFFSET',
  'VALUES',
  'BIND',
  'UNION',
  'ASC',
  'DESC',
  'EXISTS',
  'NOT EXISTS'
] as const;

const TOKEN_PATTERN = /[?$]?[A-Za-z_][\w:.-]*/g;
const MAX_SUGGESTIONS = 7;

export function sparqlCompletions(value: string, cursorOffset: number): SparqlCompletion[] {
  const prefix = completionPrefix(value, cursorOffset);
  if (prefix.length < 2) {
    return [];
  }

  const normalizedPrefix = prefix.toLowerCase();
  const beforeCursor = value.slice(0, Math.max(0, cursorOffset - prefix.length));
  const queryTerms = Array.from(beforeCursor.matchAll(TOKEN_PATTERN), (match) => match[0]);
  const candidates: SparqlCompletion[] = [
    ...queryTerms.reverse().map((label) => ({ label, source: 'Query term' as const })),
    ...SPARQL_KEYWORDS.map((label) => ({ label, source: 'SPARQL' as const }))
  ];

  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      const normalizedLabel = candidate.label.toLowerCase();
      if (
        normalizedLabel === normalizedPrefix ||
        !normalizedLabel.startsWith(normalizedPrefix) ||
        seen.has(normalizedLabel)
      ) {
        return false;
      }
      seen.add(normalizedLabel);
      return true;
    })
    .slice(0, MAX_SUGGESTIONS);
}

export function applySparqlCompletion(
  value: string,
  cursorOffset: number,
  completion: string
): CompletionEdit {
  const prefix = completionPrefix(value, cursorOffset);
  const prefixStart = cursorOffset - prefix.length;
  const nextValue = value.slice(0, prefixStart) + completion + value.slice(cursorOffset);
  return {
    value: nextValue,
    cursorOffset: prefixStart + completion.length
  };
}

function completionPrefix(value: string, cursorOffset: number): string {
  return value.slice(0, cursorOffset).match(/[?$]?[A-Za-z_][\w:.-]*$/)?.[0] ?? '';
}
