const shell = {
  topbar: '#56657A',
  topbarHover: 'rgba(245, 247, 248, 0.08)',
  sidebar: '#66758A',
  sidebarActive: '#536278',
  sidebarHover: '#5E6D82'
} as const;

const surface = {
  app: '#F1F4F6',
  panel: '#F7F9FA',
  card: '#FCFDFE',
  elevated: '#FFFFFF'
} as const;

const border = {
  default: '#D8E0E5',
  strong: '#C8D3DA'
} as const;

const text = {
  primary: '#25292D',
  secondary: '#62686E',
  muted: '#737D85',
  placeholder: '#79838B',
  navigationPrimary: '#F5F7F8',
  navigationSecondary: '#DEE3E8'
} as const;

const accent = {
  lime: '#0F7F91',
  limeHover: '#168C9E',
  limePressed: '#0A6878',
  contrastText: '#FFFFFF'
} as const;

const disabled = {
  background: '#ECEFF1',
  text: '#969FA6',
  border: '#D7DFE4'
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
    low: '#4F93A1',
    safe: '#0F7F91',
    unknown: '#7A7F7B'
  },
  securityDark: {
    critical: '#8E1C1C',
    high: '#A83B00',
    medium: '#A86F00',
    low: '#356D78',
    safe: '#0A6878',
    unknown: '#505552'
  },
  securitySurface: {
    critical: '#F8E8E8',
    high: '#FBECE5',
    medium: '#FFF6D8',
    low: '#E3F0F2',
    safe: '#DDF1F4',
    unknown: '#E3E8E4'
  },
  graph: {
    node: {
      primary: {
        border: '#4E6872',
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
        border: '#168C9E',
        background: '#DDF1F4',
        primaryText: '#12343B',
        typeText: '#0A6878',
        metaText: '#0A6878'
      }
    },
    edge: {
      affectedBy: '#B4232C',
      fixedIn: '#0F7F91',
      dependsOn: '#3E7E8A',
      identity: '#315B64'
    }
  },
  evidence: {
    remediation: {
      background: accent.lime,
      border: accent.limePressed,
      text: accent.contrastText
    },
    technicalDetails: {
      background: '#E8EDF2',
      border: shell.sidebar,
      text: '#445266'
    },
    impact: {
      background: '#F7E8DD',
      border: '#B66A3C',
      text: '#744225'
    },
    severity: {
      background: '#F5EDD1',
      border: '#A17720',
      text: '#684F18'
    },
    overview: {
      background: '#E8EDF2',
      border: '#788D9B',
      text: '#445A66'
    },
    upstreamFix: {
      background: '#DDF1F4',
      border: '#168C9E',
      text: '#0A6878'
    },
    unknown: {
      background: surface.panel,
      border: border.strong,
      text: text.secondary
    }
  }
} as const;

export type SecurityTone = keyof typeof designTokens.security;
