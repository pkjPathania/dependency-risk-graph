import type { SparqlSelectResponse } from './types';

const SPARQL_FORMAT_URL = '/api/v1/sparql/format';
const SPARQL_EXEC_URL = '/api/v1/sparql/exec';

export async function formatSparqlQuery(query: string): Promise<string> {
  const response = await fetch(SPARQL_FORMAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: query
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();
  return normalizeFormattedQuery(body, contentType);
}

export async function executeSparqlQuery(query: string): Promise<SparqlSelectResponse> {
  const response = await fetch(SPARQL_EXEC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: query
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as SparqlSelectResponse;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim() || `Formatting failed with status ${response.status}`;
  } catch {
    return `Formatting failed with status ${response.status}`;
  }
}

function normalizeFormattedQuery(body: string, contentType: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return '';
  }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        return parsed.replace(/\r\n/g, '\n');
      }
    } catch {
      // Fall through to text handling.
    }
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      return JSON.parse(trimmed).replace(/\r\n/g, '\n');
    } catch {
      return trimmed.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    }
  }

  return body.replace(/\r\n/g, '\n');
}
