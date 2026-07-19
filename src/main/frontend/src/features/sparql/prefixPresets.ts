export type SparqlPrefixPresetId = 'risk' | 'rdfs' | 'owl' | 'everything';

export interface SparqlPrefixPreset {
  id: SparqlPrefixPresetId;
  label: string;
  prefixes: string[];
}

export const SPARQL_PREFIX_PRESETS: SparqlPrefixPreset[] = [
  {
    id: 'risk',
    label: 'risk',
    prefixes: ['PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>']
  },
  {
    id: 'rdfs',
    label: 'rdfs',
    prefixes: ['PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>']
  },
  {
    id: 'owl',
    label: 'owl',
    prefixes: ['PREFIX owl: <http://www.w3.org/2002/07/owl#>']
  },
  {
    id: 'everything',
    label: 'everything',
    prefixes: [
      'PREFIX risk: <urn:io-github-pkjpathania:dependency-risk-graph:schema:>',
      'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>',
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
      'PREFIX owl: <http://www.w3.org/2002/07/owl#>',
      'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>'
    ]
  }
];

export const DEFAULT_SPARQL_QUERY = `${SPARQL_PREFIX_PRESETS[0].prefixes[0]}\n\nSELECT ?subject ?predicate ?object\nWHERE {\n  ?subject ?predicate ?object\n}\nLIMIT 25`;

const PREFIX_BLOCK_PATTERN = /^(?:\s*PREFIX[^\n]*\n)+/i;

export function applySparqlPrefixPreset(query: string, presetId: SparqlPrefixPresetId): string {
  const preset = SPARQL_PREFIX_PRESETS.find((item) => item.id === presetId);
  if (!preset) {
    return query;
  }

  const body = stripLeadingPrefixes(query);
  const prefixBlock = preset.prefixes.join('\n');

  return body ? `${prefixBlock}\n\n${body}` : prefixBlock;
}

function stripLeadingPrefixes(query: string): string {
  return query.replace(PREFIX_BLOCK_PATTERN, '').trimStart();
}
