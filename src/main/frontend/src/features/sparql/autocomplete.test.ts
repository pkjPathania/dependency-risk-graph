import { describe, expect, it } from 'vitest';
import { applySparqlCompletion, sparqlCompletions } from './autocomplete';

describe('sparqlCompletions', () => {
  it('suggests SPARQL keywords from a partial word', () => {
    expect(sparqlCompletions('SEL', 3)).toContainEqual({
      label: 'SELECT',
      source: 'SPARQL'
    });
  });

  it('suggests variables and prefixed names already used in the query', () => {
    const query = 'SELECT ?application WHERE { ?application risk:dependsOn ?package . }\n?app';
    expect(sparqlCompletions(query, query.length)).toContainEqual({
      label: '?application',
      source: 'Query term'
    });
  });

  it('does not show hints for a one-character prefix', () => {
    expect(sparqlCompletions('S', 1)).toEqual([]);
  });

  it('replaces only the partial token when applying a completion', () => {
    expect(applySparqlCompletion('SEL *', 3, 'SELECT')).toEqual({
      value: 'SELECT *',
      cursorOffset: 6
    });
  });
});
