/**
 * Commercial application configuration
 * Centralizes all production-ready configuration
 */

import pkg from '../../package.json';

// Parse full version (e.g. 1.2.1+mpa0uzje or 1.2.1+abc1234)
const rawVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : pkg.version;
const [semverPart, buildId] = rawVersion.split('+');

// Try to convert a base36 build id back to a timestamp and format it
function formatBuildDate(id?: string): string | null {
  if (!id) return null;
  try {
    const ts = parseInt(id, 36);
    if (!Number.isFinite(ts) || ts < 1e12 || ts > Date.now() + 864e5) return null;
    return new Date(ts).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export const APP_CONFIG = {
  // Application info
  APP_NAME: 'Calmiverse',
  // Injected at build time by vite (see versionJsonPlugin + define in vite.config.ts).
  // Fallback to package.json version for dev/test environments where __APP_VERSION__ isn't defined.
  APP_VERSION: rawVersion,
  APP_VERSION_CLEAN: semverPart || rawVersion,
  APP_BUILD_ID: buildId || null,
  APP_BUILD_DATE: formatBuildDate(buildId),
  APP_DESCRIPTION: 'Génération d\'histoires personnalisées pour enfants par IA',
  
  // Company info (required for legal pages)
  COMPANY: {
    NAME: 'Calmiverse',
    EMAIL: 'support@calmiverse.com',
    PRIVACY_EMAIL: 'privacy@calmiverse.com',
    DPO_EMAIL: 'dpo@calmiverse.com',
    COOKIES_EMAIL: 'cookies@calmiverse.com'
  },

  // Performance limits
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,
    MAX_TOTAL_ITEMS: 1000 // Security limit for large queries
  },

  // Rate limiting (aligned with database settings)
  RATE_LIMITS: {
    STORIES_PER_DAY: 50,
    CHILDREN_PER_USER: 10,
    MAX_STORY_LENGTH: 100000, // 100KB
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024 // 5MB
  },

  // Subscription tiers configuration
  SUBSCRIPTION_TIERS: {
    CALMINI: {
      name: 'Calmini',
      monthlyPrice: 2.00,
      features: ['10 histoires/mois', '5 enfants max', 'Support standard']
    },
    CALMIDIUM: {
      name: 'Calmidium', 
      monthlyPrice: 5.00,
      features: ['30 histoires/mois', '10 enfants max', 'Suites d\'histoires', 'Support prioritaire']
    },
    CALMIX: {
      name: 'Calmix',
      monthlyPrice: 10.00,
      features: ['50 histoires/mois', 'Enfants illimités', 'Suites d\'histoires', 'Musique de fond', 'Vidéos d\'introduction (3/mois)', '1 audio/mois', 'Accès priorité', 'Communauté Calmos']
    },
    CALMIXXL: {
      name: 'Calmixxl',
      monthlyPrice: 20.00,
      features: ['100 histoires/mois', 'Enfants illimités', 'Suites d\'histoires', 'Musique de fond', 'Vidéos d\'introduction (10/mois)', '4 audio/mois', 'Accès priorité', 'Communauté Calmos']
    }
  },

  // Security settings
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT_HOURS: 24,
    PASSWORD_MIN_LENGTH: 8
  },

  // Feature flags for production
  FEATURES: {
    CONSOLE_LOGGING: import.meta.env.DEV,
    ERROR_REPORTING: true,
    ANALYTICS: false, // Enable when analytics service is integrated
    PWA_ENABLED: true,
    OFFLINE_MODE: true
  },

  // External services
  SERVICES: {
    OPENAI_MODEL: 'gpt-4',
    TTS_PROVIDER: 'elevenlabs',
    IMAGE_PROVIDER: 'supabase'
  },

  // Support URLs
  SUPPORT: {
    DOCUMENTATION: 'https://docs.calmiverse.com',
    CONTACT: 'https://calmiverse.com/contact',
    STATUS: 'https://status.calmiverse.com'
  }
} as const;

// Environment-specific overrides
if (import.meta.env.PROD) {
  // Production-specific settings
  Object.assign(APP_CONFIG.FEATURES, {
    CONSOLE_LOGGING: false,
    ERROR_REPORTING: true
  });
}