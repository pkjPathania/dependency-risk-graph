import { Card, CardContent, Stack, Typography } from '@mui/material';
import { AssistantResultHost } from './AssistantResultHost';

export function AssistantPanel() {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Security assistant</Typography>
            <Typography variant="body2" color="text.secondary">
              Reserved mounting area for future OpenUI-rendered answers.
            </Typography>
          </Stack>
          <AssistantResultHost />
        </Stack>
      </CardContent>
    </Card>
  );
}
