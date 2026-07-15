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
    main: '#d92d20',
    light: '#fef3f2',
    dark: '#912018'
  },
  HIGH: {
    main: '#dc6803',
    light: '#fff4e5',
    dark: '#9a3412'
  },
  MEDIUM: {
    main: '#f59e0b',
    light: '#fffbeb',
    dark: '#b45309'
  },
  LOW: {
    main: '#079455',
    light: '#ecfdf3',
    dark: '#05603a'
  },
  UNKNOWN: {
    main: '#667085',
    light: '#f2f4f7',
    dark: '#475467'
  }
};
