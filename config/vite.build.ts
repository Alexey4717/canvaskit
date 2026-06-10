import type { UserConfig } from 'vite';

export const buildConfig = (isBuild: boolean): UserConfig['build'] => ({
  outDir: 'build',
  assetsDir: 'static',
  copyPublicDir: true,
  sourcemap: !isBuild,
  emptyOutDir: true,
  minify: isBuild ? 'esbuild' : false,
  reportCompressedSize: isBuild,
  chunkSizeWarningLimit: 550,
});
