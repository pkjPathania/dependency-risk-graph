import type { ApplicationOverview, DependencySummary } from '../../api/types';

export type ExploreView = 'overview' | 'dependencies' | 'vulnerabilities' | 'references';
export type ExploreTab = ExploreView;

export interface ExploreWorkspace {
  overview: ApplicationOverview;
  dependencies: DependencySummary[];
}
