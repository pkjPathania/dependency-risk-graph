import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { designTokens } from '../../theme/designTokens';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';
import { BUGGY_BRAND } from '../../features/assistant/buggyBrand';

export function AssistantView() {
  return (
    <Stack sx={{ flex: 1 }}>
      <WorkbenchViewHeader
        title={BUGGY_BRAND.heading}
        description="Grounded dependency-risk analysis using graph and advisory evidence."
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 820,
          mx: 'auto',
          mt: { xs: 4, md: 6 }
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" aria-label={BUGGY_BRAND.assistantAriaLabel}>
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
              width: 42,
              height: 42,
              bgcolor: designTokens.accent.lime,
              color: designTokens.accent.contrastText,
              borderRadius: 2,
              fontSize: '1.25rem'
            }}
          >
            {BUGGY_BRAND.icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h2"
              sx={{ color: designTokens.text.primary, fontSize: { xs: '1.45rem', md: '1.7rem' }, fontWeight: 700, lineHeight: 1.2 }}
            >
              {BUGGY_BRAND.fullName}
            </Typography>
            <Typography sx={{ mt: 0.5, color: designTokens.text.secondary, fontWeight: 600 }}>
              {BUGGY_BRAND.tagline}
            </Typography>
          </Box>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 700 }}>
          {BUGGY_BRAND.description}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            mt: 3,
            p: 1.5,
            bgcolor: designTokens.surface.card,
            borderColor: designTokens.border.default
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder={BUGGY_BRAND.inputPlaceholder}
            aria-label="Dependency risk investigation prompt"
            slotProps={{ input: { readOnly: true } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button variant="contained" color="primary" disabled>
              Ask Buggy
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
          {BUGGY_BRAND.suggestedPrompts.map((question) => (
            <Paper
              key={question}
              variant="outlined"
              sx={{
                p: 1.5,
                bgcolor: designTokens.surface.card,
                borderColor: designTokens.border.default,
                transition: 'background-color 120ms ease, border-color 120ms ease',
                '&:hover': {
                  bgcolor: designTokens.surface.panel,
                  borderColor: designTokens.border.strong
                }
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
