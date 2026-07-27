import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { Box } from '@mui/material';
import { GraphiQL } from 'graphiql';
import 'graphiql/style.css';
import { designTokens } from '../../theme/designTokens';

const graphQlFetcher = createGraphiQLFetcher({ url: '/graphql' });

export function PlaygroundView() {
  return (
    <Box
      component="section"
      aria-label="GraphQL Playground"
      sx={{
        flex: 1,
        width: '100%',
        minHeight: { xs: 640, md: 0 },
        bgcolor: designTokens.surface.card,
        overflow: 'hidden',
        '& .graphiql-container': { height: '100%' }
      }}
    >
      <GraphiQL fetcher={graphQlFetcher} forcedTheme="light">
        <GraphiQL.Logo>Dependency Risk Graph</GraphiQL.Logo>
      </GraphiQL>
    </Box>
  );
}
