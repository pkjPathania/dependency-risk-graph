import * as THREE from 'three';
import type { DependencyGraphNodeKind } from './graphTypes';

const APPLICATION_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const PACKAGE_VERSION_GEOMETRY = new THREE.SphereGeometry(0.5, 16, 12);
const VULNERABILITY_GEOMETRY = new THREE.OctahedronGeometry(0.55, 0);
const FIXED_PACKAGE_GEOMETRY = new THREE.TorusGeometry(0.48, 0.16, 10, 18);
const UNRESOLVED_GEOMETRY = new THREE.SphereGeometry(0.34, 12, 10);
const DEFAULT_GEOMETRY = new THREE.SphereGeometry(0.44, 14, 10);

export function getNodeGeometry(kind: DependencyGraphNodeKind): THREE.BufferGeometry {
  switch (kind) {
    case 'application':
      return APPLICATION_GEOMETRY;
    case 'vulnerability':
      return VULNERABILITY_GEOMETRY;
    case 'fixed-package-version':
      return FIXED_PACKAGE_GEOMETRY;
    case 'unresolved':
      return UNRESOLVED_GEOMETRY;
    case 'package-version':
      return PACKAGE_VERSION_GEOMETRY;
    case 'vulnerable-package':
    case 'package':
    default:
      return DEFAULT_GEOMETRY;
  }
}

export function disposeGraphGeometries(): void {
  APPLICATION_GEOMETRY.dispose();
  PACKAGE_VERSION_GEOMETRY.dispose();
  VULNERABILITY_GEOMETRY.dispose();
  FIXED_PACKAGE_GEOMETRY.dispose();
  UNRESOLVED_GEOMETRY.dispose();
  DEFAULT_GEOMETRY.dispose();
}
