
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Auto-generate version.json at build time from package.json
function versionJsonPlugin() {
  return {
    name: 'version-json-generator',
    buildStart() {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const versionData = JSON.stringify({ version: pkg.version }, null, 2);
      fs.writeFileSync('public/version.json', versionData + '\n');
      console.log(`[version-json] Generated version.json with version ${pkg.version}`);
    }
  };
}

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
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
    versionJsonPlugin(),
    mode === 'development' && componentTagger(),
    // PWA temporairement désactivé pour stabiliser l'application
    // Sera réactivé une fois la stabilité confirmée
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      strategies: 'generateSW',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
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
        // 🚀 PHASE 5: OPTIMISATION PERFORMANCE (Code Splitting)
        // Séparation intelligente des chunks pour optimiser le cache et le temps de chargement
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@radix-ui') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor'; // Tous les autres modules tiers
          }
        },
        
        // Optimisation des noms de fichiers pour le cache
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        
        // Séparation des assets
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'assets/styles/[name].[hash:8][extname]';
          }
          if (/\.(png|jpe?g|svg|gif|webp)$/.test(name)) {
            return 'assets/images/[name].[hash:8][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
            return 'assets/fonts/[name].[hash:8][extname]';
          }
          return 'assets/[name].[hash:8][extname]';
        }
      },
      // Optimisation des imports externes
      external: [],
    },
    chunkSizeWarningLimit: 2000, // Limite ajustée pour le code splitting
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 2, // Deux passes pour une meilleure compression
        pure_funcs: ['console.log', 'console.debug', 'console.info'], 
      },
      format: {
        comments: false
      }
    },
    // Optimisations supplémentaires
    cssCodeSplit: true, // Split CSS par chunk
    sourcemap: false, // Pas de sourcemap en prod pour réduire la taille
    reportCompressedSize: false, // Plus rapide sans calcul de taille compressée
  }
}));
