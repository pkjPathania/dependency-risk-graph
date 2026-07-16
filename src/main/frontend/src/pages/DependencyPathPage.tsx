import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { fetchDependencyPath } from '../api/dependencyPathApi';
import type { DependencyPathResponse } from '../api/types';
import { DependencyPathForm } from '../components/DependencyPathForm';
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
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.8rem', md: '2.1rem' } }}>
          Dependency Path
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Inspect the ordered dependency chain returned by the backend for a package and version.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6">Find path</Typography>
              <Typography variant="body2" color="text.secondary">
                Search for a package name and optional version using the dependency path endpoint.
              </Typography>
            </Box>

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
