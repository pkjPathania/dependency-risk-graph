import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { IconButton, Snackbar, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

interface IriValueProps {
  value: string;
}

export function IriValue({ value }: IriValueProps) {
  const [copied, setCopied] = useState(false);
  const trimmedValue = value.trim();
  const canCopy = trimmedValue.length > 0;

  async function handleCopy() {
    if (!canCopy || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmedValue);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy IRI.', error);
    }
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
        <Tooltip title={canCopy ? trimmedValue : 'No IRI available'} enterDelay={350}>
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 800,
              fontSize: '0.8rem'
            }}
          >
            {canCopy ? shortenIri(trimmedValue) : '—'}
          </Typography>
        </Tooltip>

        <Tooltip title="Copy full IRI">
          <span>
            <IconButton aria-label="Copy full IRI" size="small" onClick={handleCopy} disabled={!canCopy}>
              <ContentCopyOutlinedIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Snackbar
        open={copied}
        onClose={() => setCopied(false)}
        autoHideDuration={1200}
        message="IRI copied"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

function shortenIri(value: string): string {
  if (value.length <= 52) {
    return value;
  }

  return `…${value.slice(-51)}`;
}
