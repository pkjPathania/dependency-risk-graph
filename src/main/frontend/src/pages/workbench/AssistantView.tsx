import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { designTokens } from '../../theme/designTokens';
import { WorkbenchViewHeader } from '../../components/workbench/WorkbenchViewHeader';
import { BUGGY_BRAND } from '../../features/assistant/buggyBrand';
import { askBuggy } from '../../api/buggyApi';

export function AssistantView() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || isAsking) return;

    setIsAsking(true);
    setAnswer(null);
    setError(null);

    try {
      setAnswer(await askBuggy(normalizedQuestion));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Buggy could not answer the question.'
      );
    } finally {
      setIsAsking(false);
    }
  };

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
          component="form"
          onSubmit={handleSubmit}
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
            slotProps={{
              htmlInput: { 'aria-label': 'Dependency risk investigation prompt' }
            }}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isAsking}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!question.trim() || isAsking}
            >
              {isAsking && <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />}
              {isAsking ? BUGGY_BRAND.loadingLabel : 'Ask Buggy'}
            </Button>
          </Box>
        </Paper>

        <Box aria-live="polite">
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {answer !== null && (
            <Paper
              variant="outlined"
              sx={{ mt: 2, p: 2, bgcolor: designTokens.surface.card, borderColor: designTokens.border.default }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Buggy's answer
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{answer}</Typography>
            </Paper>
          )}
        </Box>

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
            <ButtonBase
              key={question}
              onClick={() => setQuestion(question)}
              disabled={isAsking}
              sx={{
                width: '100%',
                borderRadius: 1,
                textAlign: 'left'
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  width: '100%',
                  height: '100%',
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
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
