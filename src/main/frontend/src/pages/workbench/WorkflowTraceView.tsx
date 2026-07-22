import { Box, Stack, Typography } from '@mui/material';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';
import { designTokens } from '../../theme/designTokens';

const workflowSteps = [
  'Extract entities',
  'Query RDF graph',
  'Resolve dependency path',
  'Retrieve advisory evidence',
  'Generate grounded answer'
];

export function WorkflowTraceView() {
  return (
    <Stack spacing={3} sx={{ flex: 1 }}>
      <WorkbenchViewHeader
        title="Workflow Trace"
        description="Review the stages used to produce a grounded dependency-risk answer."
      />
      <Box sx={{ maxWidth: 640 }}>
        {workflowSteps.map((step, index) => (
          <Box key={step} sx={{ display: 'flex', gap: 2, minHeight: 68 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  border: '1px solid',
                  borderColor: designTokens.border.default,
                  borderRadius: '50%',
                  bgcolor: designTokens.surface.card,
                  color: designTokens.text.secondary,
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                {index + 1}
              </Box>
              {index < workflowSteps.length - 1 && (
                <Box sx={{ width: 1, flex: 1, bgcolor: designTokens.border.default }} />
              )}
            </Box>
            <Typography sx={{ pt: 0.5, fontWeight: 600, color: 'text.secondary' }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
