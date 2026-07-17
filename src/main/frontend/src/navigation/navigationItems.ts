export type NavigationId =
  | 'dashboard'
  | 'explorer'
  | 'sparql'
  | 'dependencyPath';

export interface NavigationItem {
  id: NavigationId;
  label: string;
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'explorer', label: 'Explore' },
  { id: 'sparql', label: 'SPARQL' },
  { id: 'dependencyPath', label: 'Dependency Path' }
];
