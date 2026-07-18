import type { ApplicationOverview, DependencySummary } from '../../api/types';

export type ExploreView = 'overview' | 'dependencies' | 'vulnerabilities' | 'references' | 'cve-impact';
export type ExploreTab = ExploreView;

export interface ExploreWorkspace {
  overview: ApplicationOverview;
  dependencies: DependencySummary[];
}
