import {
  AppBar,
  Box,
  Tab,
  Tabs,
  Toolbar,
  Stack,
  useTheme
} from '@mui/material';
import type { ReactNode } from 'react';
import { navigationItems, type NavigationId } from '../navigation/navigationItems';
import logoImage from '../logo/img.png';

interface AdminLayoutProps {
  selectedPageId: NavigationId;
  onNavigationSelect: (id: NavigationId) => void;
  children: ReactNode;
}

export function AdminLayout({
  selectedPageId,
  onNavigationSelect,
  children
}: AdminLayoutProps) {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="default"
        sx={{
          zIndex: theme.zIndex.appBar,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.84)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none'
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            px: { xs: 1.5, sm: 2.5 },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
          >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flexWrap: 'wrap' }}>
            <Box
              component="img"
              src={logoImage}
              alt="Dependency Risk Graph"
              sx={{
                display: 'block',
                width: { xs: 210, sm: 260, md: 300 },
                maxWidth: '100%',
                height: 'auto',
                flexShrink: 0
              }}
            >
            </Box>
          </Stack>

          <Box
            component="nav"
            sx={{
              ml: 'auto',
              width: { xs: '100%', sm: 'auto' },
              overflowX: 'auto'
            }}
          >
            <Tabs
              value={selectedPageId}
              onChange={(_, value: NavigationId) => onNavigationSelect(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Primary navigation"
              sx={{
                minHeight: 40,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              {navigationItems.map((item) => (
                <Tab
                  key={item.id}
                  value={item.id}
                  label={item.label}
                  {...(item.icon ? { icon: item.icon, iconPosition: 'start' as const } : {})}
                  disableRipple
                  sx={{
                    minHeight: 40,
                    minWidth: 0,
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    color: 'text.primary',
                    '&.Mui-selected': {
                      color: 'primary.dark'
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          pt: 3,
          px: { xs: 1.5, sm: 2.5, md: 3 },
          pb: 3
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
