import type { GraphSummary, NormalizedSbom } from './types';

const SBOM_UPLOAD_URL = '/api/v1/sboms';
const SBOM_RDF_URL = '/api/v1/sboms/rdf';

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

export async function exportSbomRdf(file: File): Promise<GraphSummary> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(SBOM_RDF_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as GraphSummary;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim() || `Upload failed with status ${response.status}`;
  } catch {
    return `Upload failed with status ${response.status}`;
  }
}
