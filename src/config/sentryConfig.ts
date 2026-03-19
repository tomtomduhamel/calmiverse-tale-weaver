import * as Sentry from "@sentry/react";

/**
 * Initialisation de Sentry pour le monitoring d'erreurs en production
 * Le DSN doit être fourni via la variable d'environnement VITE_SENTRY_DSN
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProd = import.meta.env.PROD;

  if (!dsn && isProd) {
    console.warn("⚠️ Sentry DSN manquant. Le monitoring d'erreurs est désactivé.");
    return;
  }

  if (dsn) {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // TracesSampleRate à 1.0 en dev/beta, à réduire en production massive
      tracesSampleRate: 1.0,
      // Replay à 10% pour optimiser le quota
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      enabled: isProd, // Activer uniquement en production (ou staging)
      beforeSend(event) {
        // Optionnel : Filtrer des erreurs connues ou verbeuses
        return event;
      },
    });
    
    console.log("🚀 [Sentry] Initialisé avec succès");
  }
};
