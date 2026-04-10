import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
          dest: ""
        }
      ]
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI component libraries
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          // Supabase client
          supabase: ['@supabase/supabase-js'],
          // Charting library (heavy)
          charts: ['recharts'],
        }
      }
    },
    // Generate source maps for debugging (never in production)
    sourcemap: mode === 'development',
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Esbuild: drop console statements in production
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
    // Security: strip all console.log/warn/info from production bundles
    // to prevent leaking auth tokens, user PII, API responses, and
    // internal paths in browser DevTools. console.error is preserved.
    ...(mode === 'production' && {
      pure: ['console.log', 'console.info', 'console.warn', 'console.debug', 'console.trace'],
    }),
  },
}));
