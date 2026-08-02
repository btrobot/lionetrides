import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/services/**/*.ts',
        'src/lib/**/*.ts',
        'src/db/**/*.ts',
        'src/components/shared/**/*.tsx',
      ],
      exclude: [
        'src/__tests__/**',
        'src/components/ui/**',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 50,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});