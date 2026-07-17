import type { DependencyPathResponse } from './types';
import { readApiErrorMessage } from './httpError';

const DEPENDENCY_PATH_URL = '/api/dependencies/path';

export async function fetchDependencyPath(
  packageName: string,
  version: string
): Promise<DependencyPathResponse> {
  const params = new URLSearchParams();
  params.set('packageName', packageName);
  if (version) {
    params.set('version', version);
  }

  const response = await fetch(`${DEPENDENCY_PATH_URL}?${params.toString()}`);

  if (!response.ok) {
    const message = await readApiErrorMessage(response, 'Request failed');
    throw new Error(message);
  }

  return (await response.json()) as DependencyPathResponse;
}
