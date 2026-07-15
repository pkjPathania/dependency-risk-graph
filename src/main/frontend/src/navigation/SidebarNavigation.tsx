import {
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import type { NavigationId, NavigationItem } from './navigationItems';

interface SidebarNavigationProps {
  items: NavigationItem[];
  selectedId: NavigationId;
  onSelect: (id: NavigationId) => void;
}

export function SidebarNavigation({ items, selectedId, onSelect }: SidebarNavigationProps) {
  return (
    <>
      <Divider />
      <List dense disablePadding sx={{ px: 1, py: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const selected = selectedId === item.id;

          return (
            <Tooltip title={item.label} placement="right" key={item.id}>
              <ListItemButton
                selected={selected}
                onClick={() => onSelect(item.id)}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  minHeight: 44,
                  '&.Mui-selected': {
                    backgroundColor: '#dbeafe',
                    '&:hover': {
                      backgroundColor: '#bfdbfe'
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: selected ? 'primary.main' : 'text.secondary'
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: selected ? 600 : 500,
                    color: selected ? 'primary.main' : 'text.primary'
                  }}
                />
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </>
  );
}
