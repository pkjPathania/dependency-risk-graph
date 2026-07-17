import type { Theme } from '@mui/material/styles';
import type { GraphNodeData } from './graphMapper';
import type { GraphScale, GraphVisualConfig } from './graphTypes';

export function getGraphScale(nodeCount: number): GraphScale {
  if (nodeCount <= 150) {
    return 'small';
  }

  if (nodeCount <= 750) {
    return 'medium';
  }

  if (nodeCount <= 2500) {
    return 'large';
  }

  return 'very-large';
}

export function getGraphVisualConfig(nodeCount: number, theme: Theme): GraphVisualConfig {
  const scale = getGraphScale(nodeCount);
  const modeBias = theme.palette.mode === 'dark' ? 1 : 0.92;

  switch (scale) {
    case 'small':
      return {
        densityMultiplier: 1.25,
        nodeResolution: 12,
        linkOpacity: 0.5 * modeBias,
        linkWidth: 1.4,
        arrowLength: 3,
        warmupTicks: 60,
        cooldownTicks: 180,
        levelDistance: 100,
        nodeOpacity: 1,
        highlightNodeBoost: 1.16,
        highlightLinkWidthBoost: 1.35,
        labelBoost: 1
      };
    case 'medium':
      return {
        densityMultiplier: 1,
        nodeResolution: 10,
        linkOpacity: 0.35 * modeBias,
        linkWidth: 1,
        arrowLength: 2.5,
        warmupTicks: 80,
        cooldownTicks: 160,
        levelDistance: 85,
        nodeOpacity: 0.96,
        highlightNodeBoost: 1.14,
        highlightLinkWidthBoost: 1.3,
        labelBoost: 0.95
      };
    case 'large':
      return {
        densityMultiplier: 0.72,
        nodeResolution: 7,
        linkOpacity: 0.16 * modeBias,
        linkWidth: 0.7,
        arrowLength: 1.5,
        warmupTicks: 100,
        cooldownTicks: 120,
        levelDistance: 65,
        nodeOpacity: 0.88,
        highlightNodeBoost: 1.12,
        highlightLinkWidthBoost: 1.5,
        labelBoost: 0.86
      };
    case 'very-large':
    default:
      return {
        densityMultiplier: 0.5,
        nodeResolution: 5,
        linkOpacity: 0.07 * modeBias,
        linkWidth: 0.28,
        arrowLength: 0,
        warmupTicks: 120,
        cooldownTicks: 80,
        levelDistance: 50,
        nodeOpacity: 0.8,
        highlightNodeBoost: 1.1,
        highlightLinkWidthBoost: 1.65,
        labelBoost: 0.75
      };
  }
}

export function getNodeValue(
  node: GraphNodeData,
  degree: number,
  nodeCount: number,
  densityMultiplierOverride?: number
): number {
  const densityMultiplier = densityMultiplierOverride ?? getDensityMultiplier(nodeCount);
  const degreeScale = 1 + Math.log2(Math.max(1, degree));
  const roleBase = getRoleBaseSize(node);
  const size = roleBase * degreeScale * densityMultiplier;

  return clamp(size, 1.4, 20);
}

export function getLabelTextHeight(scale: GraphScale, isApplication: boolean): number {
  if (scale === 'very-large') {
    return isApplication ? 7.75 : 5.75;
  }

  if (scale === 'large') {
    return isApplication ? 8.25 : 6.1;
  }

  return isApplication ? 8.75 : 6.5;
}

export function getNodeOpacityForScale(nodeCount: number, isHighlighted: boolean): number {
  const scale = getGraphScale(nodeCount);
  if (isHighlighted) {
    return 1;
  }

  switch (scale) {
    case 'small':
      return 1;
    case 'medium':
      return 0.9;
    case 'large':
      return 0.76;
    case 'very-large':
      return 0.62;
    default:
      return 0.82;
  }
}

export function getSemanticOpacity(baseOpacity: number, isDimmed: boolean): number {
  return isDimmed ? baseOpacity * 0.32 : baseOpacity;
}

function getDensityMultiplier(nodeCount: number): number {
  const scale = getGraphScale(nodeCount);
  switch (scale) {
    case 'small':
      return 1.25;
    case 'medium':
      return 1;
    case 'large':
      return 0.72;
    case 'very-large':
      return 0.5;
    default:
      return 1;
  }
}

function getRoleBaseSize(node: GraphNodeData): number {
  if (node.isApplication) {
    return 12.5;
  }

  const normalizedType = normalizeType(node.type);
  if (normalizedType.includes('VULNERABILITY')) {
    return 9;
  }

  if (normalizedType.includes('FIXED')) {
    return 7.5;
  }

  if (normalizedType.includes('UNRESOLVED')) {
    return 2.1;
  }

  if (normalizedType.includes('PACKAGEVERSION')) {
    return 3.2;
  }

  return 2.4;
}

function normalizeType(value: string | null): string {
  return value ? value.replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
