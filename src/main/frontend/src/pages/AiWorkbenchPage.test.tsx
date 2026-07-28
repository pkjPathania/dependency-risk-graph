import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiWorkbenchPage } from './AiWorkbenchPage';

vi.mock('graphiql', () => ({
  GraphiQL: Object.assign(
    ({
      schema,
      schemaDescription,
      inputValueDeprecation
    }: {
      schema?: unknown;
      schemaDescription?: boolean;
      inputValueDeprecation?: boolean;
    }) => (
      <div
        data-testid="graphiql-interface"
        data-auto-import-schema={schema === undefined}
        data-schema-description={schemaDescription}
        data-input-value-deprecation={inputValueDeprecation}
      />
    ),
    { Logo: () => null }
  )
}));

describe('AiWorkbenchPage', () => {
  it('opens GraphiQL from the Playground section', async () => {
    const user = userEvent.setup();
    render(<AiWorkbenchPage />);

    await user.click(screen.getByRole('button', { name: 'Playground' }));

    expect(
      await screen.findByRole('region', { name: 'GraphQL Playground' })
    ).toBeInTheDocument();
    const graphiql = await screen.findByTestId('graphiql-interface');
    expect(graphiql).toBeInTheDocument();
    expect(graphiql).toHaveAttribute('data-auto-import-schema', 'true');
    expect(graphiql).toHaveAttribute('data-schema-description', 'true');
    expect(graphiql).toHaveAttribute('data-input-value-deprecation', 'true');
  });
});
