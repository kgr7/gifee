import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',  // Use ES modules in workers
    plugins: [], // Workers use same plugins as main build
  },
  optimizeDeps: {
    exclude: ['gifee_wasm'],  // Don't pre-bundle WASM module
  },
  server: {
    headers: process.env.ENABLE_ISOLATION === 'true' ? {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    } : undefined,
    fs: {
      allow: ['..'],  // Allow accessing wasm directory
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});