import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import FullscreenExitOutlinedIcon from '@mui/icons-material/FullscreenExitOutlined';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import type { GraphColorMode, GraphLayoutMode, GraphScale } from './graphTypes';

interface DependencyGraphToolbarProps {
  graphBackground: string;
  graphBorderColor: string;
  graphScale: GraphScale;
  layoutMode: GraphLayoutMode;
  colorMode: GraphColorMode;
  linkCount: number;
  nodeCount: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onLayoutChange: (event: React.MouseEvent<HTMLElement>, nextLayout: GraphLayoutMode | null) => void;
  onColorModeChange: (event: React.MouseEvent<HTMLElement>, nextMode: GraphColorMode | null) => void;
  onFitGraph: () => void;
  onResetSelection: () => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

export function DependencyGraphToolbar({
  graphBackground,
  graphBorderColor,
  graphScale,
  layoutMode,
  colorMode,
  linkCount,
  nodeCount,
  searchTerm,
  onSearchTermChange,
  onLayoutChange,
  onColorModeChange,
  onFitGraph,
  onResetSelection,
  onFullscreenToggle,
  isFullscreen
}: DependencyGraphToolbarProps) {
  return (
    <Stack
      spacing={1.25}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: graphBorderColor,
        bgcolor: graphBackground
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.25}
      >
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
            Dependency graph
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {nodeCount.toLocaleString()} nodes, {linkCount.toLocaleString()} links, {graphScale} scale
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          <Chip label={`${nodeCount.toLocaleString()} nodes`} size="small" variant="outlined" />
          <Chip label={`${linkCount.toLocaleString()} links`} size="small" variant="outlined" />
          <IconButton
            onClick={onFullscreenToggle}
            aria-label={isFullscreen ? 'Exit fullscreen graph' : 'Fullscreen graph'}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            {isFullscreen ? <FullscreenExitOutlinedIcon fontSize="small" /> : <FullscreenOutlinedIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Stack>

      <TextField
        label="Search packages"
        placeholder="Search by name, version, PURL, or bomRef"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        size="small"
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        spacing={1.25}
      >
        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Layout
          </Typography>
          <ToggleButtonGroup exclusive size="small" value={layoutMode} onChange={onLayoutChange} aria-label="Graph layout mode">
            <ToggleButton value="force" aria-label="Explore layout">
              Explore
            </ToggleButton>
            <ToggleButton value="radial" aria-label="Radial layout">
              Radial
            </ToggleButton>
            <ToggleButton value="flow" aria-label="Dependency flow layout">
              Dependency flow
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Color mode
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={colorMode}
            onChange={onColorModeChange}
            aria-label="Graph color mode"
          >
            <ToggleButton value="semantic">Semantic</ToggleButton>
            <ToggleButton value="depth">Depth</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={0.75} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Actions
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" startIcon={<CenterFocusStrongOutlinedIcon fontSize="small" />} onClick={onFitGraph}>
              Fit graph
            </Button>
            <Button size="small" variant="outlined" startIcon={<RestartAltOutlinedIcon fontSize="small" />} onClick={onResetSelection}>
              Reset selection
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
