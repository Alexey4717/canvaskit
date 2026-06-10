import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { UserConfig } from 'vite';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const resolveConfig: UserConfig['resolve'] = {
  alias: {
    '@': path.resolve(projectRoot, 'src'),
  },
};
