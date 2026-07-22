export const BUGGY_BRAND = {
  name: 'Buggy',
  fullName: 'Buggy the Snitch',
  heading: 'Ask Buggy',
  tagline: 'Tell me what’s lurking in your dependencies.',
  description: 'Ask about vulnerable packages, affected applications, dependency paths, advisory evidence, or fixed versions.',
  inputPlaceholder: 'Ask Buggy what’s lurking in your dependencies...',
  compactInputPlaceholder: 'Ask Buggy...',
  loadingLabel: 'Buggy is snitching...',
  icon: '🐞',
  assistantAriaLabel: 'Buggy the Snitch assistant',
  suggestedPrompts: [
    'Is this application affected by CVE-2026-54515?',
    'Show the dependency path to this vulnerability.',
    'Which applications use the vulnerable package?',
    'What version fixes this vulnerability?',
    'Compare the available remediation options.'
  ]
} as const;

export const BUGGY_TOOL_LOADING_LABELS = {
  find_vulnerability: 'Buggy is checking the vulnerability records...',
  find_affected_applications: 'Buggy is finding everyone affected...',
  find_vulnerable_packages: 'Buggy is identifying the suspicious packages...',
  resolve_dependency_paths: 'Buggy is following the dependency trail...',
  find_fixed_versions: 'Buggy is looking for a clean getaway version...',
  retrieve_advisory_evidence: 'Buggy is gathering the receipts...',
  compare_remediation_options: 'Buggy is comparing your escape routes...',
  run_readonly_sparql: 'Buggy is interrogating the graph...'
} as const;

export type BuggyToolName = keyof typeof BUGGY_TOOL_LOADING_LABELS;

export function buggyLoadingLabel(toolName?: string): string {
  return toolName && toolName in BUGGY_TOOL_LOADING_LABELS
    ? BUGGY_TOOL_LOADING_LABELS[toolName as BuggyToolName]
    : BUGGY_BRAND.loadingLabel;
}
