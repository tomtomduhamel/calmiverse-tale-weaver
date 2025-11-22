
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
    // PWA temporairement désactivé pour stabiliser l'application
    // Sera réactivé une fois la stabilité confirmée
    ...(false ? [VitePWA({
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
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
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
              }
            }
          }
        ]
      }
    })] : []),
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
          // 🚀 PHASE 2: CHUNKING SIMPLIFIÉ - Bundle React Monolithique
          if (id.includes('node_modules')) {
            // ✅ CRITICAL: UN SEUL BUNDLE REACT pour éliminer toutes les race conditions
            if (
              id.includes('react') ||        // react, react-dom, react-router, react-hook-form, etc.
              id.includes('next-themes') ||  // Utilise React.createContext et useLayoutEffect
              id.includes('scheduler') ||    // Dépendance interne de React
              id.includes('@radix-ui')       // Tous les composants Radix utilisent React
            ) {
              return 'vendor-react-bundle';  // UN SEUL GROS CHUNK STABLE
            }
            
            // Backend & Data - séparé mais stable
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'vendor-backend';
            }
            
            // Tout le reste - misc
            return 'vendor-misc';
          }
          
          // App chunks - séparation logique par feature
          if (id.includes('src/')) {
            // Services lourds par feature
            if (id.includes('hooks/stories') || id.includes('services/stories')) {
              return 'app-stories';
            }
            if (id.includes('hooks/subscription') || id.includes('services/subscription')) {
              return 'app-subscription';
            }
            if (id.includes('hooks/notifications') || id.includes('services/notifications')) {
              return 'app-notifications';
            }
            
            // Composants lourds par section
            if (id.includes('components/story/') || id.includes('components/reader/')) {
              return 'app-story-ui';
            }
            if (id.includes('components/library/')) {
              return 'app-library-ui';
            }
            if (id.includes('components/subscription/')) {
              return 'app-subscription-ui';
            }
            
            // Composants UI réutilisables - chunk partagé
            if (id.includes('components/ui/')) {
              return 'app-ui-shared';
            }
          }
        },
        // Optimisation des noms de chunks pour le cache
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // Chunks vendors avec hash court pour stabilité du cache
          if (name.startsWith('vendor-')) {
            return 'assets/[name].[hash:8].js';
          }
          // Chunks app avec hash complet
          return 'assets/[name].[hash].js';
        },
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
    chunkSizeWarningLimit: 1000, // Limite plus stricte pour forcer la modularité
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Garder console pour debug mobile
        drop_debugger: true,
        passes: 1 // Une seule passe pour build plus stable
      },
      format: {
        comments: false // Enlever tous les commentaires
      }
    },
    // Optimisations supplémentaires
    cssCodeSplit: true, // Split CSS par chunk
    sourcemap: false, // Pas de sourcemap en prod pour réduire la taille
    reportCompressedSize: false, // Plus rapide sans calcul de taille compressée
  }
}));
