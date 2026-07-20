import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import { useId, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { alpha } from '@mui/material/styles';
import { designTokens } from '../../theme/designTokens';

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
  const [isDragging, setIsDragging] = useState(false);

  function selectFile(file: File | null) {
    setSelectedFile(file);
    setValidationError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

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
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${designTokens.colors.surface} 0%, ${designTokens.colors.surfaceMuted} 100%)`
      }}
    >
      {loading ? <LinearProgress aria-label="Uploading SBOM" /> : null}
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 750 }}>
              Ingest a software bill of materials
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add a CycloneDX JSON document to build or extend the dependency graph.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <Box
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 170,
                  p: 2.5,
                  textAlign: 'center',
                  border: '1.5px dashed',
                  borderColor: isDragging ? designTokens.colors.accent : selectedFile ? 'success.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: isDragging
                    ? designTokens.colors.surfaceMuted
                    : selectedFile
                      ? alpha(designTokens.security.safe, 0.08)
                      : designTokens.colors.white,
                  transition: 'background-color 160ms ease, border-color 160ms ease'
                }}
              >
                <Stack spacing={1.25} alignItems="center">
                  <Box
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '14px',
                      color: selectedFile ? 'success.main' : designTokens.colors.navigation,
                      bgcolor: selectedFile
                        ? alpha(designTokens.security.safe, 0.16)
                        : designTokens.colors.surfaceMuted
                    }}
                  >
                    {selectedFile ? <CheckCircleOutlineRoundedIcon /> : <UploadFileRoundedIcon />}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>
                      {selectedFile ? 'SBOM ready to upload' : 'Drop your CycloneDX file here'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      JSON format · one file at a time
                    </Typography>
                  </Box>
                  <Button
                    component="label"
                    htmlFor={fileInputId}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                  >
                    {selectedFile ? 'Choose another file' : 'Browse files'}
                  </Button>
                </Stack>
              </Box>
              <Box
                component="input"
                id={fileInputId}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                sx={{ display: 'none' }}
              />

              {selectedFile ? (
                <Chip
                  icon={<DescriptionOutlinedIcon />}
                  label={`${selectedFile.name} · ${formatFileSize(selectedFile.size)}`}
                  onDelete={loading ? undefined : () => selectFile(null)}
                  sx={{ alignSelf: 'flex-start', maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden' } }}
                />
              ) : null}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<UploadFileRoundedIcon />}
                  disabled={loading || !selectedFile}
                  sx={{ px: 2.5 }}
                >
                  {loading ? 'Building graph…' : 'Ingest SBOM'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Securely sent as multipart form data
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
