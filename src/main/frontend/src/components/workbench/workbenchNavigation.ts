export const workbenchNavigation = [
  { id: 'assistant', label: 'Assistant' },
  { id: 'dependency-analysis', label: 'Dependency Analysis' },
  { id: 'cve-analysis', label: 'CVE Analysis' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'workflow-trace', label: 'Workflow Trace' }
] as const;

export type WorkbenchNavigationId = typeof workbenchNavigation[number]['id'];
