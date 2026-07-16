import type { DependencyPathResponse } from './types';

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
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as DependencyPathResponse;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim() || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
