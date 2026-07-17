import type { ApiErrorResponse } from './types';

export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body = await response.text();
    if (!body.trim()) {
      return `${fallbackMessage} (status ${response.status})`;
    }

    try {
      const parsed = JSON.parse(body) as Partial<ApiErrorResponse>;
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      // Fall back to plain text below.
    }

    return body.trim();
  } catch {
    return `${fallbackMessage} (status ${response.status})`;
  }
}
