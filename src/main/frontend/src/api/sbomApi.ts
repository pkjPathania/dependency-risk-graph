import type { GraphMetadata, NormalizedSbom } from './types';

const SBOM_UPLOAD_URL = '/api/v1/sboms';
const GRAPH_METADATA_URL = '/api/v1/metadata';

export async function uploadSbom(file: File): Promise<NormalizedSbom> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(SBOM_UPLOAD_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as NormalizedSbom;
}

export async function fetchGraphMetadata(): Promise<GraphMetadata> {
  const response = await fetch(GRAPH_METADATA_URL);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as GraphMetadata;
}

export function escapePercent(value: string): string {
  return value.replaceAll('%', '%25');
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim() || `Upload failed with status ${response.status}`;
  } catch {
    return `Upload failed with status ${response.status}`;
  }
}
