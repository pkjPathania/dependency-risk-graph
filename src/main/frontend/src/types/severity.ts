import { designTokens } from '../theme/designTokens';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export const severityColors: Record<
  Severity,
  {
    main: string;
    light: string;
    dark: string;
  }
> = {
  CRITICAL: {
    main: designTokens.security.critical,
    light: designTokens.securitySurface.critical,
    dark: designTokens.securityDark.critical
  },
  HIGH: {
    main: designTokens.security.high,
    light: designTokens.securitySurface.high,
    dark: designTokens.securityDark.high
  },
  MEDIUM: {
    main: designTokens.security.medium,
    light: designTokens.securitySurface.medium,
    dark: designTokens.securityDark.medium
  },
  LOW: {
    main: designTokens.security.low,
    light: designTokens.securitySurface.low,
    dark: designTokens.securityDark.low
  },
  UNKNOWN: {
    main: designTokens.security.unknown,
    light: designTokens.securitySurface.unknown,
    dark: designTokens.securityDark.unknown
  }
};
