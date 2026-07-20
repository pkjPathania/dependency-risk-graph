export const designTokens = {
  colors: {
    canvas: '#A4B1A8',
    appShell: '#F2F3F1',
    surface: '#EBEEEC',
    surfaceMuted: '#E3E8E4',
    navigation: '#191A1D',
    navigationDark: '#0F1012',
    navigationHover: '#292B2E',
    navigationSelected: '#3A3C3F',
    navigationTextMuted: '#C2C6C3',
    textPrimary: '#191A1D',
    textSecondary: '#626663',
    accent: '#ECF896',
    accentHover: '#E2EF82',
    accentDark: '#DCEB72',
    accentLight: '#F4FBC7',
    border: '#D8DEDA',
    brandWhite: '#F7F8F6',
    white: '#FFFFFF'
  },
  security: {
    critical: '#C62828',
    high: '#E65100',
    medium: '#F9A825',
    low: '#728978',
    safe: '#8FA75F',
    unknown: '#7A7F7B'
  },
  securityDark: {
    critical: '#8E1C1C',
    high: '#A83B00',
    medium: '#A86F00',
    low: '#4D6253',
    safe: '#60733C',
    unknown: '#505552'
  },
  securitySurface: {
    critical: '#F8E8E8',
    high: '#FBECE5',
    medium: '#FFF6D8',
    low: '#E8EEE9',
    safe: '#EDF1E3',
    unknown: '#E3E8E4'
  }
} as const;

export type SecurityTone = keyof typeof designTokens.security;
