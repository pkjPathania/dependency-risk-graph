import { Box, Stack } from '@mui/material';
import { designTokens } from '../../theme/designTokens';
import { WorkbenchNavItem } from './WorkbenchNavItem';
import {
  workbenchNavigation,
  type WorkbenchNavigationId
} from './workbenchNavigation';
import { workbenchStyles } from './workbenchStyles';

interface WorkbenchSidebarProps {
  selectedSection: WorkbenchNavigationId;
  onSectionSelect: (section: WorkbenchNavigationId) => void;
}

export function WorkbenchSidebar({
  selectedSection,
  onSectionSelect
}: WorkbenchSidebarProps) {
  return (
    <Box
      component="nav"
      aria-label="AI Workbench navigation"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: '100%',
        px: 1.625,
        pt: 2,
        pb: 2,
        bgcolor: designTokens.colors.navigation,
        borderRadius: workbenchStyles.panelRadius,
        overflow: 'hidden'
      }}
    >
      <Stack spacing={0.75}>
        {workbenchNavigation.map((item) => (
          <WorkbenchNavItem
            key={item.id}
            label={item.label}
            selected={selectedSection === item.id}
            onClick={() => onSectionSelect(item.id)}
          />
        ))}
      </Stack>
    </Box>
  );
}
