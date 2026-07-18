import { type ReactElement } from 'react';

export type NavigationId =
  | 'dashboard'
  | 'explorer'
  | 'vulnerabilityEnrichment'
  | 'sparql'
  | 'dependencyPath';

export interface NavigationItem {
  id: NavigationId;
  label: string;
  icon?: ReactElement;
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'explorer', label: 'Explore' },
  {
    id: 'vulnerabilityEnrichment',
    label: 'Vulnerability Enrichment'
  },
  { id: 'sparql', label: 'SPARQL' },
  { id: 'dependencyPath', label: 'Dependency Path' }
];
