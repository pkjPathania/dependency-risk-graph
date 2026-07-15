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
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">SBOM upload</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a CycloneDX JSON SBOM to populate the inventory and graph views.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
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
                <Typography variant="body2" color="text.secondary">
                  Submit as multipart form data
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
          {backendError ? <Alert severity="error">{backendError}</Alert> : null}
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
          {rdfStatusMessage ? <Alert severity="info">{rdfStatusMessage}</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function looksLikeJson(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.json') || file.type === 'application/json' || file.type === '';
}
