import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
    // Generate source maps for debugging
    sourcemap: mode === 'development',
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
}));
