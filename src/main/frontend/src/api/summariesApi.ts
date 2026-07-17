import type { ApplicationSummary } from './types';
import { readApiErrorMessage } from './httpError';

const SUMMARIES_URL = '/api/v1/summaries';

export async function fetchApplicationSummaries(): Promise<ApplicationSummary[]> {
  const response = await fetch(SUMMARIES_URL);

  if (!response.ok) {
    const message = await readApiErrorMessage(response, 'Failed to load summaries');
    throw new Error(message);
  }

  return (await response.json()) as ApplicationSummary[];
}
