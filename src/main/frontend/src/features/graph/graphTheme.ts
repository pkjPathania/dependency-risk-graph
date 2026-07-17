import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import type {
  DependencyGraphNode,
  DependencyLinkPredicate,
  GraphColorMode,
  GraphScale
} from './graphTypes';

export function getNodeSemanticKind(node: DependencyGraphNode): DependencyGraphNode['kind'] {
  if (node.isApplication) {
    return 'application';
  }

  const normalizedType = normalizeType(node.type);

  if (normalizedType.includes('VULNERABILITY')) {
    return 'vulnerability';
  }

  if (normalizedType.includes('FIXED')) {
    return 'fixed-package-version';
  }

  if (normalizedType.includes('UNRESOLVED')) {
    return 'unresolved';
  }

  if (normalizedType.includes('VULNERABLE')) {
    return 'vulnerable-package';
  }

  if (normalizedType.includes('PACKAGEVERSION')) {
    return 'package-version';
  }

  return 'package';
}

export function getSemanticNodeColor(
  node: DependencyGraphNode,
  theme: Theme,
  scale: GraphScale,
  colorMode: GraphColorMode,
  isHighlighted: boolean,
  isDimmed: boolean
): string {
  const opacity = isDimmed ? getDimmedOpacity(scale) : getBaseOpacity(scale, isHighlighted);
  const depthAccent = getDepthAccent(node.depth, theme, scale);

  if (colorMode === 'depth') {
    return alpha(depthAccent, opacity);
  }

  switch (node.kind) {
    case 'application':
      return alpha(theme.palette.primary.main, opacity);
    case 'vulnerability':
      return alpha(theme.palette.error.main, opacity);
    case 'fixed-package-version':
      return alpha(theme.palette.success.main, opacity);
    case 'unresolved':
      return alpha(theme.palette.text.disabled, Math.min(opacity, 0.36));
    case 'vulnerable-package':
      return alpha(theme.palette.warning.main, opacity);
    case 'package-version':
      return alpha(theme.palette.secondary.main, opacity);
    case 'package':
    default:
      return alpha(theme.palette.text.secondary, opacity);
  }
}

export function getSemanticLinkColor(
  predicate: DependencyLinkPredicate,
  theme: Theme,
  scale: GraphScale,
  isHighlighted: boolean,
  isDimmed: boolean
): string {
  const opacity = isDimmed ? getDimmedOpacity(scale) : getBaseLinkOpacity(scale, isHighlighted);

  switch (predicate) {
    case 'AFFECTED_BY':
      return alpha(theme.palette.warning.main, opacity);
    case 'FIXED_IN':
      return alpha(theme.palette.success.main, opacity);
    case 'DEPENDS_ON':
    default:
      return alpha(theme.palette.divider, opacity);
  }
}

export function getLabelBackground(theme: Theme): string {
  return alpha(theme.palette.background.paper, 0.82);
}

export function getGraphBorderColor(theme: Theme): string {
  return alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.8 : 1);
}

function getBaseOpacity(scale: GraphScale, isHighlighted: boolean): number {
  if (isHighlighted) {
    return 1;
  }

  switch (scale) {
    case 'small':
      return 0.95;
    case 'medium':
      return 0.82;
    case 'large':
      return 0.68;
    case 'very-large':
      return 0.52;
    default:
      return 0.8;
  }
}

function getDimmedOpacity(scale: GraphScale): number {
  switch (scale) {
    case 'small':
      return 0.42;
    case 'medium':
      return 0.28;
    case 'large':
      return 0.16;
    case 'very-large':
      return 0.1;
    default:
      return 0.2;
  }
}

function getBaseLinkOpacity(scale: GraphScale, isHighlighted: boolean): number {
  if (isHighlighted) {
    return 1;
  }

  switch (scale) {
    case 'small':
      return 0.28;
    case 'medium':
      return 0.18;
    case 'large':
      return 0.08;
    case 'very-large':
      return 0.04;
    default:
      return 0.2;
  }
}

function getDepthAccent(depth: number, theme: Theme, scale: GraphScale): string {
  if (depth <= 0) {
    return theme.palette.primary.main;
  }

  if (depth === 1) {
    return theme.palette.info.main;
  }

  if (depth === 2) {
    return theme.palette.secondary.main;
  }

  if (depth === 3) {
    return theme.palette.warning.main;
  }

  return alpha(theme.palette.text.secondary, scale === 'very-large' ? 0.85 : 0.7);
}

function normalizeType(value: string | null): string {
  return value ? value.replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
}
