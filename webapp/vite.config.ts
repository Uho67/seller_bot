import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:3012', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3012', changeOrigin: true },
    },
  },
});
