import type { ApplicationOverview, ApplicationSummary, DependencySummary } from '../../api/types';
import { readApiErrorMessage } from '../../api/httpError';

const EXPLORE_BASE_URL = '/api/v1/explore';

export async function fetchApplicationSummaries(): Promise<ApplicationSummary[]> {
  const response = await fetch(`${EXPLORE_BASE_URL}/applications`);

  if (!response.ok) {
    const message = await readApiErrorMessage(response, 'Failed to load applications');
    throw new Error(message);
  }

  return (await response.json()) as ApplicationSummary[];
}

export async function fetchApplicationOverview(applicationIri: string): Promise<ApplicationOverview> {
  const response = await fetchExploreResource('/overview', applicationIri, 'Failed to load application summary');

  return (await response.json()) as ApplicationOverview;
}

export async function fetchApplicationDependencies(applicationIri: string): Promise<DependencySummary[]> {
  const response = await fetchExploreResource(
    '/dependencies',
    applicationIri,
    'Failed to load application dependencies'
  );

  return (await response.json()) as DependencySummary[];
}

async function fetchExploreResource(path: string, applicationIri: string, fallbackMessage: string): Promise<Response> {
  const iri = applicationIri?.trim();
  if (!iri) {
    throw new Error('applicationIri is required');
  }

  const params = new URLSearchParams({ applicationIri: iri });
  const response = await fetch(`${EXPLORE_BASE_URL}${path}?${params.toString()}`);

  if (!response.ok) {
    const message = await readApiErrorMessage(response, fallbackMessage);
    throw new Error(message);
  }

  return response;
}
