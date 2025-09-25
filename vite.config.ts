
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Calmi - Histoires personnalisées pour enfants',
        short_name: 'Calmi',
        description: 'Créez des histoires personnalisées pour vos enfants avec l\'intelligence artificielle',
        theme_color: '#A8DADC',
        background_color: '#F1FAEE',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // Pour injectManifest, pas de config workbox ici
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit pour éviter l'erreur
        swSrc: 'src/sw.ts',
        swDest: 'sw.mjs'
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Séparer les vendors principaux
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('openai')) {
              return 'vendor-openai';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('lucide-react')) {
              return 'vendor-utils';
            }
            if (id.includes('jszip') || id.includes('epubjs')) {
              return 'epub-services';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            return 'vendor-misc';
          }
          
          // Séparer les hooks/services lourds
          if (id.includes('src/hooks/stories') || id.includes('src/services/stories')) {
            return 'story-services';
          }
          if (id.includes('src/hooks/notifications') || id.includes('src/services/notifications')) {
            return 'notification-services';
          }
          if (id.includes('src/components/story/')) {
            return 'story-components';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  }
}));
