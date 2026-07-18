declare module '@mui/icons-material/*' {
  import type { ComponentType } from 'react';

  const component: ComponentType<Record<string, unknown>>;
  export default component;
}
