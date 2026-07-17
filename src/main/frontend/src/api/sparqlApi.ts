import type { SparqlSelectResponse } from './types';
import { readApiErrorMessage } from './httpError';

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
    const message = await readApiErrorMessage(response, 'Formatting failed');
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
    const message = await readApiErrorMessage(response, 'Execution failed');
    throw new Error(message);
  }

  return (await response.json()) as SparqlSelectResponse;
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
