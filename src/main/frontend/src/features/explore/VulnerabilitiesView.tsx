import { ExploreEmptyState } from './ExploreEmptyState';

export function VulnerabilitiesView() {
  return (
    <ExploreEmptyState
      title="Vulnerabilities"
      message="Run OSV enrichment to populate vulnerability data."
    />
  );
}
