import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BUGGY_BRAND, buggyLoadingLabel } from '../../features/assistant/buggyBrand';
import { AssistantView } from './AssistantView';

const apiMocks = vi.hoisted(() => ({ askBuggy: vi.fn() }));

vi.mock('../../api/buggyApi', () => apiMocks);

describe('AssistantView', () => {
  beforeEach(() => {
    apiMocks.askBuggy.mockReset();
    apiMocks.askBuggy.mockResolvedValue('Upgrade the affected package to version 2.4.1.');
  });

  it('introduces Buggy and renders the branded investigation prompts', () => {
    render(<AssistantView />);

    expect(screen.getByRole('heading', { name: BUGGY_BRAND.heading })).toBeInTheDocument();
    const buggyName = screen.getByRole('heading', { name: BUGGY_BRAND.fullName });
    expect(buggyName).not.toHaveTextContent(BUGGY_BRAND.icon);
    expect(screen.getByLabelText(BUGGY_BRAND.assistantAriaLabel)).toBeInTheDocument();
    expect(screen.getByText(BUGGY_BRAND.tagline)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(BUGGY_BRAND.inputPlaceholder)).toBeInTheDocument();
    BUGGY_BRAND.suggestedPrompts.forEach((prompt) => expect(screen.getByText(prompt)).toBeInTheDocument());
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
  });

  it('asks Buggy and displays the returned answer', async () => {
    const user = userEvent.setup();
    render(<AssistantView />);

    const input = screen.getByLabelText('Dependency risk investigation prompt');
    await user.type(input, 'Which version fixes CVE-2026-54515?');
    await user.click(screen.getByRole('button', { name: 'Ask Buggy' }));

    await waitFor(() => {
      expect(apiMocks.askBuggy).toHaveBeenCalledWith('Which version fixes CVE-2026-54515?');
    });
    expect(await screen.findByText("Buggy's answer")).toBeInTheDocument();
    expect(screen.getByText('Upgrade the affected package to version 2.4.1.')).toBeInTheDocument();
  });

  it('uses a suggested investigation to populate the question', async () => {
    const user = userEvent.setup();
    render(<AssistantView />);

    await user.click(screen.getByRole('button', { name: BUGGY_BRAND.suggestedPrompts[0] }));

    expect(screen.getByLabelText('Dependency risk investigation prompt')).toHaveValue(
      BUGGY_BRAND.suggestedPrompts[0]
    );
    expect(apiMocks.askBuggy).not.toHaveBeenCalled();
  });

  it('shows API failures without rendering an answer', async () => {
    const user = userEvent.setup();
    apiMocks.askBuggy.mockRejectedValue(new Error('Assistant model is unavailable.'));
    render(<AssistantView />);

    await user.type(screen.getByLabelText('Dependency risk investigation prompt'), 'What is affected?');
    await user.click(screen.getByRole('button', { name: 'Ask Buggy' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Assistant model is unavailable.');
    expect(screen.queryByText("Buggy's answer")).not.toBeInTheDocument();
  });

  it('provides stable tool-specific loading labels without changing tool identifiers', () => {
    expect(buggyLoadingLabel('resolve_dependency_paths')).toBe('Buggy is following the dependency trail...');
    expect(buggyLoadingLabel('run_readonly_sparql')).toBe('Buggy is interrogating the graph...');
    expect(buggyLoadingLabel()).toBe(BUGGY_BRAND.loadingLabel);
  });
});
