import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { fetchDependencyPath } from '../api/dependencyPathApi';
import type { DependencyPathResponse } from '../api/types';
import { DependencyPathForm } from '../components/DependencyPathForm';
import { RestCallProgress } from '../components/RestCallProgress';
import { DependencyPathView } from '../components/DependencyPathView';

const DEFAULT_PACKAGE_NAME = 'spring-core';
const DEFAULT_VERSION = '7.0.8';

export function DependencyPathPage() {
  const [packageName, setPackageName] = useState(DEFAULT_PACKAGE_NAME);
  const [version, setVersion] = useState(DEFAULT_VERSION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<DependencyPathResponse | null>(null);
  const [hasQueried, setHasQueried] = useState(false);

  async function handleFindPath() {
    if (!packageName) {
      setError('Package name is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasQueried(true);
    setResponse(null);

    try {
      const nextResponse = await fetchDependencyPath(packageName, version);
      setResponse(nextResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load dependency path.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={2}>
      <RestCallProgress visible={loading} />
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.55rem', md: '1.8rem' }, fontWeight: 800, lineHeight: 1.1 }}>
          Dependency Path
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
          Inspect the ordered dependency chain returned by the backend for a package and version.
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.25}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, fontSize: '0.68rem' }}
            >
              Search
            </Typography>

            <DependencyPathForm
              packageName={packageName}
              version={version}
              loading={loading}
              onPackageNameChange={setPackageName}
              onVersionChange={setVersion}
              onSubmit={handleFindPath}
            />
          </Stack>
        </CardContent>
      </Card>

      <DependencyPathView loading={loading} error={error} hasQueried={hasQueried} response={response} />
    </Stack>
  );
}
