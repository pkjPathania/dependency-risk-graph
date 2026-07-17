export type NavigationId =
  | 'dashboard'
  | 'sparql'
  | 'dependencyPath';

export interface NavigationItem {
  id: NavigationId;
  label: string;
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sparql', label: 'SPARQL Query' },
  { id: 'dependencyPath', label: 'Dependency Path' }
];
