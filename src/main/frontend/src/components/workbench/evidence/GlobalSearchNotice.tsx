import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Alert } from '@mui/material';
import { designTokens } from '../../../theme/designTokens';

export function GlobalSearchNotice() {
  return (
    <Alert
      icon={<InfoOutlinedIcon fontSize="small" />}
      variant="outlined"
      severity="info"
      sx={{
        py: 0.25,
        bgcolor: designTokens.surface.panel,
        borderColor: designTokens.border.default,
        color: designTokens.text.secondary,
        '& .MuiAlert-icon': { color: designTokens.shell.sidebar, pt: 0.5 },
        '& .MuiAlert-message': { py: 0.5 }
      }}
    >
      Results are ranked by semantic similarity and may include related advisories. Buggy’s final
      workflow will resolve named CVE or GHSA identifiers through the knowledge graph before
      retrieving scoped evidence.
    </Alert>
  );
}
