import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = env.VITE_BASE_PATH || '/pachka';

  return {
    plugins: [react()],
    base: `${basePath}/`,
    server: {
      proxy: {
        [`${basePath}/api`]: {
          target: 'http://localhost:3006',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${basePath}`), ''),
        },
        [`${basePath}/uploads`]: {
          target: 'http://localhost:3006',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${basePath}`), ''),
        },
      },
    },
  };
});
