import { defineConfig } from 'vite';

import { buildConfig } from './config/vite.build';
import { resolveConfig } from './config/vite.resolve';
import { serverConfig } from './config/vite.server';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    base: (process.env.PUBLIC_URL ?? '').replace(/\/?$/, '/'),
    resolve: resolveConfig,
    server: serverConfig,
    build: buildConfig(isBuild),
    optimizeDeps: {
      force: true,
    },
    publicDir: 'public',
    logLevel: 'info',
  };
});
