import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import {
  AppBar,
  Box,
  Tab,
  Tabs,
  Toolbar,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import type { ReactNode } from 'react';
import { navigationItems, type NavigationId } from '../navigation/navigationItems';

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
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.15,
                py: 0.75,
                borderRadius: 999,
                background: 'linear-gradient(135deg, rgba(23, 32, 51, 0.98), rgba(37, 99, 235, 0.9))',
                color: '#f8fafc',
                boxShadow: '0 10px 26px rgba(23, 32, 51, 0.16)',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              <AccountTreeOutlinedIcon fontSize="small" />
              <Typography variant="body2" component="span" sx={{ fontWeight: 900, letterSpacing: '0.04em' }}>
                Dependency Risk Graph
              </Typography>
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
