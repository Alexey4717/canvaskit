import type { UserConfig } from 'vite';

export const serverConfig: UserConfig['server'] = {
  port: 3000,
  host: true,
  open: true,
};
