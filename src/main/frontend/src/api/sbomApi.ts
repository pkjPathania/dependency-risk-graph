import type { GraphMetadata } from './types';
import { readApiErrorMessage } from './httpError';

const SBOM_RDF_UPLOAD_URL = '/api/v1/sboms/rdf';
const GRAPH_METADATA_URL = '/api/v1/metadata';

export async function uploadSbomAsRdf(file: File): Promise<GraphMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(SBOM_RDF_UPLOAD_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const message = await readApiErrorMessage(response, 'Upload failed');
    throw new Error(message);
  }

  return (await response.json()) as GraphMetadata;
}

export async function fetchGraphMetadata(): Promise<GraphMetadata> {
  const response = await fetch(GRAPH_METADATA_URL);

  if (!response.ok) {
    const message = await readApiErrorMessage(response, 'Failed to load graph metadata');
    throw new Error(message);
  }

  return (await response.json()) as GraphMetadata;
}

export function escapePercent(value: string): string {
  return value.replaceAll('%', '%25');
}
