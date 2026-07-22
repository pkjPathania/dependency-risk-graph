import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  Box,
  Button,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useState, type ReactNode } from 'react';
import { designTokens } from '../../theme/designTokens';
import { WorkbenchSidebar } from './WorkbenchSidebar';
import type { WorkbenchNavigationId } from './workbenchNavigation';
import { workbenchStyles } from './workbenchStyles';

interface WorkbenchLayoutProps {
  selectedSection: WorkbenchNavigationId;
  onSectionSelect: (section: WorkbenchNavigationId) => void;
  children: ReactNode;
}

export function WorkbenchLayout({
  selectedSection,
  onSectionSelect,
  children
}: WorkbenchLayoutProps) {
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSectionSelect(section: WorkbenchNavigationId) {
    onSectionSelect(section);
    setDrawerOpen(false);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        minHeight: { md: 'calc(100dvh - 112px)' }
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', sm: 'block' },
          flex: {
            sm: `0 0 ${workbenchStyles.tabletSidebarWidth}px`,
            md: `0 0 ${workbenchStyles.desktopSidebarWidth}px`
          },
          width: {
            sm: workbenchStyles.tabletSidebarWidth,
            md: workbenchStyles.desktopSidebarWidth
          }
        }}
      >
        <WorkbenchSidebar
          selectedSection={selectedSection}
          onSectionSelect={handleSectionSelect}
        />
      </Box>

      {smallScreen && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: workbenchStyles.desktopSidebarWidth,
                p: 1,
                bgcolor: designTokens.shell.sidebar
              }
            }
          }}
        >
          <WorkbenchSidebar
            selectedSection={selectedSection}
            onSectionSelect={handleSectionSelect}
          />
        </Drawer>
      )}

      <Box
        component="section"
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minWidth: 0,
          minHeight: { xs: 520, md: 'auto' },
          px: { xs: 2, sm: 3, md: 3.5 },
          py: 3,
          bgcolor: designTokens.surface.panel,
          border: '1px solid',
          borderColor: designTokens.border.default,
          borderRadius: workbenchStyles.panelRadius,
          overflow: 'hidden'
        }}
      >
        {smallScreen && (
          <Button
            variant="outlined"
            startIcon={<MenuRoundedIcon />}
            onClick={() => setDrawerOpen(true)}
            sx={{ alignSelf: 'flex-start', mb: 2 }}
          >
            Workbench sections
          </Button>
        )}
        {children}
      </Box>
    </Box>
  );
}
