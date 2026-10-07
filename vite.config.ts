import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: { outDir: mode === 'demo' ? 'dist-demo' : 'dist' },
  test: { environment: 'node', include: ['src/domain/__tests__/**/*.test.ts'] },
}));
