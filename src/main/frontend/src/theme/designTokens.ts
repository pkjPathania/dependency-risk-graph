const shell = {
  topbar: '#56657A',
  topbarHover: 'rgba(245, 247, 248, 0.08)',
  sidebar: '#66758A',
  sidebarActive: '#536278',
  sidebarHover: '#5E6D82'
} as const;

const surface = {
  app: '#F1F3F0',
  panel: '#F7F8F5',
  card: '#FCFDFB',
  elevated: '#FFFFFF'
} as const;

const border = {
  default: '#D8DDD8',
  strong: '#C8CFC9'
} as const;

const text = {
  primary: '#25292D',
  secondary: '#62686E',
  muted: '#767D79',
  placeholder: '#7C837F',
  navigationPrimary: '#F5F7F8',
  navigationSecondary: '#DEE3E8'
} as const;

const accent = {
  lime: '#DDEB70',
  limeHover: '#E6F28A',
  limePressed: '#D1DF65',
  contrastText: '#25292D'
} as const;

const disabled = {
  background: '#ECEEEC',
  text: '#989E9A',
  border: '#D8DCD9'
} as const;

export const designTokens = {
  shell,
  surface,
  border,
  text,
  accent,
  disabled,
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
  },
  graph: {
    node: {
      primary: {
        border: '#4E5751',
        background: surface.card,
        primaryText: text.primary,
        typeText: text.secondary,
        metaText: text.muted
      },
      neutral: {
        border: border.strong,
        background: surface.card,
        primaryText: text.primary,
        typeText: text.secondary,
        metaText: text.muted
      },
      warning: {
        border: '#F06B3C',
        background: '#FFF1E8',
        primaryText: '#241710',
        typeText: '#5A3525',
        metaText: '#5A3525'
      },
      error: {
        border: '#D64545',
        background: '#FDECEC',
        primaryText: '#2B1111',
        typeText: '#663232',
        metaText: '#663232'
      },
      success: {
        border: '#82984D',
        background: '#EFF5DF',
        primaryText: '#1E2812',
        typeText: '#4B5B2E',
        metaText: '#4B5B2E'
      }
    },
    edge: {
      affectedBy: '#B4232C',
      fixedIn: '#58752C',
      dependsOn: '#405A4B',
      identity: '#26302A'
    }
  }
} as const;

export type SecurityTone = keyof typeof designTokens.security;
