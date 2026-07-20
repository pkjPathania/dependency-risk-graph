import {
  AppBar,
  Box,
  Tab,
  Tabs,
  Toolbar,
  useTheme
} from '@mui/material';
import type { ReactNode } from 'react';
import { DependencyRiskGraphBrand } from '../components/branding/DependencyRiskGraphBrand';
import { navigationItems, type NavigationId } from '../navigation/navigationItems';
import { designTokens } from '../theme/designTokens';

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
    <Box sx={{ minHeight: '100vh', bgcolor: designTokens.colors.canvas }}>
      <AppBar
        position="sticky"
        color="default"
        sx={{
          zIndex: theme.zIndex.appBar,
          backdropFilter: 'blur(12px)',
          backgroundColor: designTokens.colors.navigation,
          borderBottom: '1px solid',
          borderColor: designTokens.colors.navigationSelected,
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
          <DependencyRiskGraphBrand onClick={() => onNavigationSelect('dashboard')} />

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
                  backgroundColor: designTokens.colors.accent
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
                    color: designTokens.colors.navigationTextMuted,
                    '&.Mui-selected': {
                      color: designTokens.colors.white,
                      backgroundColor: designTokens.colors.navigationSelected
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
          pb: 3,
          bgcolor: designTokens.colors.appShell
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
