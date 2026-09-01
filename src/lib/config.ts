/**
 * Commercial application configuration
 * Centralizes all production-ready configuration
 */

import pkg from '../../package.json';

// Parse full version (e.g. 1.3.0+mpa0uzje or 1.3.0+abc1234)
const rawVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : pkg.version;
const [semverPart, buildId] = rawVersion.split('+');

const buildNumber =
  typeof __APP_BUILD_NUMBER__ !== 'undefined' ? __APP_BUILD_NUMBER__ : null;
const buildTimestamp =
  typeof __APP_BUILD_TIMESTAMP__ !== 'undefined' ? __APP_BUILD_TIMESTAMP__ : null;

// Format a human date from the build timestamp (preferred) or from a base36 build id (fallback)
function formatBuildDate(ts?: string | null, id?: string): string | null {
  try {
    let date: Date | null = null;
    if (ts) {
      date = new Date(ts);
    } else if (id) {
      const n = parseInt(id, 36);
      if (Number.isFinite(n) && n > 1e12 && n < Date.now() + 864e5) {
        date = new Date(n);
      }
    }
    if (!date || isNaN(date.getTime())) return null;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export const APP_CONFIG = {
  // Application info
  APP_NAME: 'Calmi',
  // Injected at build time by vite (see versionJsonPlugin + define in vite.config.ts).
  // Fallback to package.json version for dev/test environments where __APP_VERSION__ isn't defined.
  APP_VERSION: rawVersion,
  APP_VERSION_CLEAN: semverPart || rawVersion,
  APP_BUILD_ID: buildId || null,
  APP_BUILD_NUMBER: buildNumber,
  APP_BUILD_TIMESTAMP: buildTimestamp,
  APP_BUILD_DATE: formatBuildDate(buildTimestamp, buildId),
  APP_DESCRIPTION: 'Histoires personnalisées, rituels du coucher & audio immersif pour enfants',
  
  // Company info (required for legal pages)
  COMPANY: {
    NAME: 'Calmi',
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
      features: ['10 histoires/mois', '1 enfant max', 'Support standard']
    },
    CALMIDIUM: {
      name: 'Calmidium', 
      monthlyPrice: 5.00,
      features: ['30 histoires/mois', '2 enfants max', 'Partage Tribu/Famille', 'Envoi sur liseuse Kindle', 'Suites d\'histoires', '10 générations audio/mois', '1 clonage vocal']
    },
    CALMIX: {
      name: 'Calmix',
      monthlyPrice: 10.00,
      features: ['50 histoires/mois', 'Enfants illimités', 'Partage Tribu/Famille', 'Envoi Kindle', 'Routines d\'histoires (19h30)', 'Multi-Voix Théâtre IA', '3 vidéos d\'intro/mois', '20 générations audio/mois', '3 clonages vocaux']
    },
    CALMIXXL: {
      name: 'Calmixxl',
      monthlyPrice: 20.00,
      features: ['100 histoires/mois', 'Enfants illimités', 'Partage Tribu/Famille', 'Envoi Kindle', 'Routines d\'histoires illimitées', 'Multi-Voix Théâtre IA', '10 vidéos d\'intro/mois', '40 générations audio/mois', '10 clonages vocaux']
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
    TTS_PROVIDER: 'vps-hostinger',
    IMAGE_PROVIDER: 'supabase'
  },

  // Support URLs
  SUPPORT: {
    DOCUMENTATION: '/documentation',
    CONTACT: '/contact',
    STATUS: '/status'
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