import { Stack } from '@mui/material';
import { WorkbenchPlaceholder } from '../../components/workbench/WorkbenchPlaceholder';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';

export function DependencyAnalysisView() {
  return (
    <Stack spacing={3} sx={{ flex: 1 }}>
      <WorkbenchViewHeader
        title="Dependency Analysis"
        description="Investigate application dependency exposure and the paths connecting packages."
      />
      <WorkbenchPlaceholder
        title="Dependency graph and path visualization"
        description="Select an application and package to inspect its dependency path here."
        minHeight={360}
      />
    </Stack>
  );
}
