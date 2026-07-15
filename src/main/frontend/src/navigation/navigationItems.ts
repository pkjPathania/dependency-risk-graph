import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

export type NavigationId =
  | 'dashboard'
  | 'applications'
  | 'dependencies'
  | 'vulnerabilities'
  | 'assistant'
  | 'settings';

export interface NavigationItem {
  id: NavigationId;
  label: string;
  icon: typeof DashboardOutlinedIcon;
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { id: 'applications', label: 'Applications', icon: AppsOutlinedIcon },
  { id: 'dependencies', label: 'Dependencies', icon: AccountTreeOutlinedIcon },
  { id: 'vulnerabilities', label: 'Vulnerabilities', icon: SecurityOutlinedIcon },
  { id: 'assistant', label: 'Security Assistant', icon: SmartToyOutlinedIcon },
  { id: 'settings', label: 'Settings', icon: SettingsOutlinedIcon }
];
