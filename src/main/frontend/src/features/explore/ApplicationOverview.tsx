import { Box } from '@mui/material';
import type { ApplicationOverview as ApplicationOverviewModel } from '../../api/types';
import { OverviewMetricCard } from './OverviewMetricCard';

interface ApplicationOverviewProps {
  overview: ApplicationOverviewModel | null;
  loading: boolean;
}

export function ApplicationOverview({ overview, loading }: ApplicationOverviewProps) {
  const metrics = [
    {
      label: 'Direct dependencies',
      value: formatMetric(overview?.directDependencyCount),
      caption: 'Immediate dependencies'
    },
    {
      label: 'Transitive dependencies',
      value: formatMetric(overview?.transitiveDependencyCount),
      caption: 'Beyond direct dependencies'
    },
    {
      label: 'Unique packages',
      value: formatMetric(overview?.uniquePackageCount),
      caption: 'Package-version resources'
    },
    {
      label: 'Graph nodes',
      value: formatMetric(overview?.graphNodeCount),
      caption: 'Nodes in the selected subgraph'
    },
    {
      label: 'Graph edges',
      value: formatMetric(overview?.graphEdgeCount),
      caption: 'Dependency relationships'
    },
    {
      label: 'Vulnerable packages',
      value: formatMetric(overview?.vulnerablePackageCount),
      caption: 'Not available'
    },
    {
      label: 'Critical vulnerabilities',
      value: formatMetric(overview?.criticalVulnerabilityCount),
      caption: 'Not available'
    },
    {
      label: 'Last enriched',
      value: overview?.lastEnrichedAt ? overview.lastEnrichedAt : '—',
      caption: overview?.lastEnrichedAt ? 'Latest enrichment timestamp' : 'Not available'
    }
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }
      }}
    >
      {metrics.map((metric) => (
        <OverviewMetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          caption={metric.caption}
          loading={loading}
        />
      ))}
    </Box>
  );
}

function formatMetric(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return value.toLocaleString();
}
