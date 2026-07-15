import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import type { ReactNode } from 'react';
import { SidebarNavigation } from '../navigation/SidebarNavigation';
import { navigationItems, type NavigationId } from '../navigation/navigationItems';

const DRAWER_WIDTH = 240;

interface AdminLayoutProps {
  title: string;
  selectedPageId: NavigationId;
  mobileDrawerOpen: boolean;
  onMobileDrawerToggle: () => void;
  onNavigationSelect: (id: NavigationId) => void;
  children: ReactNode;
}

export function AdminLayout({
  title,
  selectedPageId,
  mobileDrawerOpen,
  onMobileDrawerToggle,
  onNavigationSelect,
  children
}: AdminLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2.25, minHeight: 64 }}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            Dependency Risk Graph
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supply-chain security console
          </Typography>
        </Stack>
      </Toolbar>
      <Divider />
      <SidebarNavigation items={navigationItems} selectedId={selectedPageId} onSelect={onNavigationSelect} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, sm: 2.5 } }}>
          {!isDesktop ? (
            <IconButton
              edge="start"
              onClick={onMobileDrawerToggle}
              aria-label="Open navigation"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" noWrap sx={{ fontSize: '1.05rem' }}>
              {title}
            </Typography>
            <Chip label="Dependency risk graph" size="small" variant="outlined" />
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileDrawerOpen}
          onClose={onMobileDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          pt: 8,
          px: { xs: 1.5, sm: 2.5, md: 3 },
          pb: 3
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
