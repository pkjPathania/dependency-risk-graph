import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { designTokens } from '../../theme/designTokens';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';

const suggestedInvestigations = [
  'Is Pulsar affected by CVE-2026-54515?',
  'Show the dependency path to the vulnerable package.',
  'Which applications share this vulnerability?',
  'What version should I upgrade to?'
];

export function AssistantView() {
  return (
    <Stack sx={{ flex: 1 }}>
      <WorkbenchViewHeader
        title="Assistant"
        description="Explore dependency risk using grounded graph and advisory evidence."
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 820,
          mx: 'auto',
          mt: { xs: 4, md: 6 }
        }}
      >
        <Typography
          component="h2"
          sx={{ fontSize: { xs: '1.45rem', md: '1.7rem' }, fontWeight: 700, lineHeight: 1.2 }}
        >
          Ask Dependency Risk Graph
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 700 }}>
          Investigate applications, dependencies, vulnerabilities, remediation, and advisory evidence.
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            mt: 3,
            p: 1.5,
            bgcolor: designTokens.colors.white,
            borderColor: designTokens.colors.border
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Enter a dependency risk investigation..."
            aria-label="Dependency risk investigation prompt"
            slotProps={{ input: { readOnly: true } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button variant="contained" disabled>
              Submit
            </Button>
          </Box>
        </Paper>

        <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1.25 }}>
          Suggested investigations
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.25
          }}
        >
          {suggestedInvestigations.map((question) => (
            <Paper
              key={question}
              variant="outlined"
              sx={{
                p: 1.5,
                bgcolor: designTokens.colors.accentLight,
                borderColor: designTokens.colors.accentDark
              }}
            >
              <Typography variant="body2" fontWeight={600}>{question}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
