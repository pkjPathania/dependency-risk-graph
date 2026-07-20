import { Box, Stack } from '@mui/material';
import { WorkbenchPlaceholder } from '../../components/workbench/WorkbenchPlaceholder';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';

const cvePlaceholders = [
  ['Affected applications', 'Applications exposed to the selected vulnerability.'],
  ['Installed version', 'Package versions currently present in imported SBOMs.'],
  ['Fixed version', 'Available remediation version from advisory evidence.']
] as const;

export function CveAnalysisView() {
  return (
    <Stack spacing={3} sx={{ flex: 1 }}>
      <WorkbenchViewHeader
        title="CVE Analysis"
        description="Review vulnerability impact, installed package versions, and available fixes."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: 2
        }}
      >
        {cvePlaceholders.map(([title, description]) => (
          <WorkbenchPlaceholder key={title} title={title} description={description} />
        ))}
      </Box>
    </Stack>
  );
}
