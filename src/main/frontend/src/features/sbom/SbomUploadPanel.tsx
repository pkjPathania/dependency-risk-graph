import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { RestCallProgress } from '../../components/RestCallProgress';

interface SbomUploadPanelProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  backendError: string | null;
  successMessage: string | null;
  rdfStatusMessage: string | null;
}

export function SbomUploadPanel({
  onUpload,
  loading,
  backendError,
  successMessage,
  rdfStatusMessage
}: SbomUploadPanelProps) {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileName = useMemo(() => selectedFile?.name ?? 'No file selected', [selectedFile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setValidationError('Select a CycloneDX JSON file before uploading.');
      return;
    }

    if (!looksLikeJson(selectedFile)) {
      setValidationError('Only CycloneDX JSON files are supported.');
      return;
    }

    setValidationError(null);
    await onUpload(selectedFile);
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={1.25}>
          <RestCallProgress visible={loading} />
          <Box sx={{ display: 'grid', gap: 0.2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, fontSize: '0.68rem' }}
            >
              Upload SBOM
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1}>
              <TextField
                id={fileInputId}
                label="CycloneDX JSON file"
                type="file"
                inputProps={{ accept: '.json,application/json' }}
                onChange={(event) => {
                  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
                  setSelectedFile(file);
                  setValidationError(null);
                }}
                helperText={fileName}
              />
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<UploadFileOutlinedIcon />}
                  disabled={loading}
                >
                  {loading ? 'Uploading...' : 'Upload SBOM'}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Submit as multipart form data
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {validationError ? (
            <Alert severity="warning" sx={{ whiteSpace: 'pre-wrap' }}>
              {validationError}
            </Alert>
          ) : null}
          {backendError ? (
            <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
              {backendError}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert severity="success" sx={{ whiteSpace: 'pre-wrap' }}>
              {successMessage}
            </Alert>
          ) : null}
          {rdfStatusMessage ? (
            <Alert severity="info" sx={{ whiteSpace: 'pre-wrap' }}>
              {rdfStatusMessage}
            </Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function looksLikeJson(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.json') || file.type === 'application/json' || file.type === '';
}
