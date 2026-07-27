import { afterEach, describe, expect, it, vi } from 'vitest';
import { askBuggy } from './buggyApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buggy API', () => {
  it('asks the workbench endpoint with an encoded question and returns its text answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('Upgrade the affected package to 2.4.1.', { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(askBuggy('  What fixes CVE-2026-54515?  ')).resolves.toBe(
      'Upgrade the affected package to 2.4.1.'
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/workbench/buggy/ask?question=What+fixes+CVE-2026-54515%3F'
    );
  });

  it('surfaces the API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Assistant model is unavailable.' }), {
          status: 503
        })
      )
    );

    await expect(askBuggy('What is affected?')).rejects.toThrow(
      'Assistant model is unavailable.'
    );
  });
});
