import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';

export type NavigationId =
  | 'dashboard'
  | 'sparql'
  | 'dependencyPath';

export interface NavigationItem {
  id: NavigationId;
  label: string;
  icon: typeof DashboardOutlinedIcon;
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { id: 'sparql', label: 'SPARQL Query', icon: ManageSearchOutlinedIcon },
  { id: 'dependencyPath', label: 'Dependency Path', icon: AltRouteOutlinedIcon }
];
