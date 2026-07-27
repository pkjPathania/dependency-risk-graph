import { readApiErrorMessage } from './httpError';

const BUGGY_ASK_URL = '/api/workbench/buggy/ask';

export async function askBuggy(question: string): Promise<string> {
  const normalizedQuestion = question.trim();
  const query = new URLSearchParams({ question: normalizedQuestion });
  const response = await fetch(`${BUGGY_ASK_URL}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'Buggy could not answer the question.'));
  }

  return response.text();
}
