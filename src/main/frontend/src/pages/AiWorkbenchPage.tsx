import { useState } from 'react';
import { WorkbenchLayout } from '../components/workbench/WorkbenchLayout';
import type { WorkbenchNavigationId } from '../components/workbench/workbenchNavigation';
import { AssistantView } from './workbench/AssistantView';
import { CveAnalysisView } from './workbench/CveAnalysisView';
import { DependencyAnalysisView } from './workbench/DependencyAnalysisView';
import { EvidenceView } from './workbench/EvidenceView';
import { WorkflowTraceView } from './workbench/WorkflowTraceView';

function renderWorkbenchSection(section: WorkbenchNavigationId) {
  switch (section) {
    case 'assistant':
      return <AssistantView />;
    case 'dependency-analysis':
      return <DependencyAnalysisView />;
    case 'cve-analysis':
      return <CveAnalysisView />;
    case 'evidence':
      return <EvidenceView />;
    case 'workflow-trace':
      return <WorkflowTraceView />;
  }
}

export function AiWorkbenchPage() {
  const [selectedSection, setSelectedSection] = useState<WorkbenchNavigationId>('assistant');

  return (
    <WorkbenchLayout
      selectedSection={selectedSection}
      onSectionSelect={setSelectedSection}
    >
      {renderWorkbenchSection(selectedSection)}
    </WorkbenchLayout>
  );
}
