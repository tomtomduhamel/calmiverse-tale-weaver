
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Compute a unique build version (package.json + build id)
const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const BUILD_ID =
  process.env.LOVABLE_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  process.env.COMMIT_REF?.slice(0, 7) ||
  Date.now().toString(36);
const FULL_APP_VERSION = `${pkgJson.version}+${BUILD_ID}`;

// Human-readable, monotonic build number based on UTC build time: YYMMDD.HHMM
const _now = new Date();
const _pad = (n: number) => n.toString().padStart(2, '0');
const BUILD_NUMBER =
  `${_pad(_now.getUTCFullYear() % 100)}${_pad(_now.getUTCMonth() + 1)}${_pad(_now.getUTCDate())}` +
  `.${_pad(_now.getUTCHours())}${_pad(_now.getUTCMinutes())}`;
const BUILD_TIMESTAMP = _now.toISOString();

// Emit version.json into the build output (not into public/) at bundle time
function versionJsonPlugin() {
  return {
    name: 'version-json-generator',
    apply: 'build' as const,
    generateBundle(this: any) {
      const versionData = JSON.stringify({
        version: FULL_APP_VERSION,
        buildNumber: BUILD_NUMBER,
        buildTimestamp: BUILD_TIMESTAMP,
      }, null, 2);
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionData + '\n',
      });
      console.log(`[version-json] Emitted version.json with version ${FULL_APP_VERSION} (build ${BUILD_NUMBER})`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(FULL_APP_VERSION),
    __APP_BUILD_NUMBER__: JSON.stringify(BUILD_NUMBER),
    __APP_BUILD_TIMESTAMP__: JSON.stringify(BUILD_TIMESTAMP),
  },
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
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // skipWaiting intentionally omitted (defaults to false):
        // the new SW waits in `reg.waiting` instead of auto-activating.
        // usePWA.ts detects reg.waiting reliably without any race condition.
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        runtimeCaching: [
          {
            // version.json must never be served from SW cache — always hit the network
            urlPattern: /\/version\.json(\?.*)?$/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-nav',
              networkTimeoutSeconds: 3,
            },
          },
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
