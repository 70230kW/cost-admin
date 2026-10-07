import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: { outDir: mode === 'demo' ? 'dist-demo' : 'dist' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
