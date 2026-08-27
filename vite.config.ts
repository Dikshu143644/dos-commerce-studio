import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Radix UI component primitives
          ui: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Charting library (large dependency)
          charts: ['recharts'],
          // Data fetching and caching
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  // To analyze bundle size, install rollup-plugin-visualizer:
  //   pnpm add -D rollup-plugin-visualizer
  // Then add to plugins array:
  //   import { visualizer } from 'rollup-plugin-visualizer';
  //   plugins: [react(), tailwindcss(), visualizer({ open: true })]
  // Run: pnpm build
  // This generates stats.html with an interactive treemap of the bundle.
});
