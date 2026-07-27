import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiWorkbenchPage } from './AiWorkbenchPage';

vi.mock('graphiql', () => ({
  GraphiQL: Object.assign(() => <div data-testid="graphiql-interface" />, {
    Logo: () => null
  })
}));

describe('AiWorkbenchPage', () => {
  it('opens GraphiQL from the Playground section', async () => {
    const user = userEvent.setup();
    render(<AiWorkbenchPage />);

    await user.click(screen.getByRole('button', { name: 'Playground' }));

    expect(
      await screen.findByRole('region', { name: 'GraphQL Playground' })
    ).toBeInTheDocument();
    expect(await screen.findByTestId('graphiql-interface')).toBeInTheDocument();
  });
});
