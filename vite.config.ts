
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
        // 🚀 PHASE 5: BUILD MONOLITHIQUE COMPLET (zéro code splitting)
        // Désactive complètement le chunking pour garantir un ordre de chargement fiable sur mobile
        manualChunks: undefined, // ❌ PAS de chunking du tout - un seul bundle
        
        // Optimisation des noms de fichiers pour le cache
        chunkFileNames: 'assets/[name].[hash].js',
        
        // Séparation des assets uniquement
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
    chunkSizeWarningLimit: 5000, // Limite plus élevée pour le bundle monolithique
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
