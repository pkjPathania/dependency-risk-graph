import { Tabs, Tab } from '@mui/material';
import type { ExploreTab } from './exploreTypes';

interface ExploreTabsProps {
  value: ExploreTab;
  onChange: (nextTab: ExploreTab) => void;
  disabled: boolean;
}

export function ExploreTabs({ value, onChange, disabled }: ExploreTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, nextValue: ExploreTab) => onChange(nextValue)}
      aria-label="Explore tabs"
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        minHeight: 40,
        '& .MuiTabs-indicator': {
          height: 3,
          borderRadius: 999
        }
      }}
    >
      <Tab disabled={disabled} label="Overview" value="overview" sx={tabSx} />
      <Tab disabled={disabled} label="Dependencies" value="dependencies" sx={tabSx} />
      <Tab disabled={disabled} label="Vulnerabilities" value="vulnerabilities" sx={tabSx} />
      <Tab disabled={disabled} label="References" value="references" sx={tabSx} />
      <Tab disabled={disabled} label="CVE Impact" value="cve-impact" sx={tabSx} />
    </Tabs>
  );
}

const tabSx = {
  minHeight: 40,
  minWidth: 0,
  px: 1.5,
  py: 0.8,
  borderRadius: 999,
  textTransform: 'none',
  fontWeight: 700
};
