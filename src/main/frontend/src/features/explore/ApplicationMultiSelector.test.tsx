import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationMultiSelector } from './ApplicationMultiSelector';

const applications = [
  { iri: 'urn:test:app:0', name: 'Orders', version: '1.0' },
  { iri: 'urn:test:app:1', name: 'Analytics', version: '2.0' }
];

describe('ApplicationMultiSelector', () => {
  it('adds an application to the shared Explore selection', async () => {
    const onChange = vi.fn();
    render(
      <ApplicationMultiSelector
        applications={applications}
        selectedApplicationIris={['urn:test:app:0']}
        loading={false}
        onChange={onChange}
      />
    );

    await userEvent.click(screen.getByLabelText('Applications'));
    await userEvent.click(screen.getByRole('option', { name: /Analytics/ }));

    expect(onChange).toHaveBeenCalledWith(['urn:test:app:0', 'urn:test:app:1']);
  });

  it('selects every available application', async () => {
    const onChange = vi.fn();
    render(
      <ApplicationMultiSelector
        applications={applications}
        selectedApplicationIris={['urn:test:app:0']}
        loading={false}
        onChange={onChange}
      />
    );

    await userEvent.click(screen.getByLabelText('Applications'));
    await userEvent.click(screen.getByRole('option', { name: /Select all applications/ }));

    expect(onChange).toHaveBeenCalledWith(['urn:test:app:0', 'urn:test:app:1']);
  });
});
