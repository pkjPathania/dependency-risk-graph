import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BUGGY_BRAND, buggyLoadingLabel } from '../../features/assistant/buggyBrand';
import { AssistantView } from './AssistantView';

describe('AssistantView', () => {
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

  it('provides stable tool-specific loading labels without changing tool identifiers', () => {
    expect(buggyLoadingLabel('resolve_dependency_paths')).toBe('Buggy is following the dependency trail...');
    expect(buggyLoadingLabel('run_readonly_sparql')).toBe('Buggy is interrogating the graph...');
    expect(buggyLoadingLabel()).toBe(BUGGY_BRAND.loadingLabel);
  });
});
