import { CircularProgress, Stack } from '@mui/material';
import { lazy, Suspense, useState } from 'react';
import { WorkbenchLayout } from '../components/workbench/WorkbenchLayout';
import type { WorkbenchNavigationId } from '../components/workbench/workbenchNavigation';
import { AssistantView } from './workbench/AssistantView';
import { CveAnalysisView } from './workbench/CveAnalysisView';
import { DependencyAnalysisView } from './workbench/DependencyAnalysisView';
import { EvidenceView } from './workbench/EvidenceView';
import { WorkflowTraceView } from './workbench/WorkflowTraceView';

const PlaygroundView = lazy(() =>
  import('./workbench/PlaygroundView').then(({ PlaygroundView: component }) => ({
    default: component
  }))
);

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
    case 'playground':
      return (
        <Suspense
          fallback={
            <Stack sx={{ flex: 1 }} alignItems="center" justifyContent="center">
              <CircularProgress aria-label="Loading GraphQL Playground" />
            </Stack>
          }
        >
          <PlaygroundView />
        </Suspense>
      );
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
