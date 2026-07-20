import { Box, Stack } from '@mui/material';
import { WorkbenchPlaceholder } from '../../components/workbench/WorkbenchPlaceholder';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';

export function EvidenceView() {
  return (
    <Stack spacing={3} sx={{ flex: 1 }}>
      <WorkbenchViewHeader
        title="Evidence"
        description="Inspect the graph relationships and advisory sources supporting an analysis."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
          flex: 1
        }}
      >
        <WorkbenchPlaceholder
          title="Graph Evidence"
          description="Dependency paths and relevant RDF relationships will appear here."
          minHeight={300}
        />
        <WorkbenchPlaceholder
          title="Advisory Evidence"
          description="Advisory identifiers, references, affected ranges, and fixes will appear here."
          minHeight={300}
        />
      </Box>
    </Stack>
  );
}
