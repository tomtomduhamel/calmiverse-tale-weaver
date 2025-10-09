/**
 * Safe Mode Detection pour Mobile Preview
 * Détecte si on est sur mobile dans un iframe de preview
 * et active des garde-fous pour éviter les blocages au boot
 */

import { isPreviewIframe } from './previewDetection';

/**
 * Détecte si on est sur un appareil mobile
 */
export function isMobile(): boolean {
  try {
    // Media query (Tailwind breakpoint)
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    if (mediaQuery.matches) return true;

    // User Agent fallback (léger)
    const ua = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  } catch {
    return false;
  }
}

/**
 * Détermine si on doit activer le Safe Mode
 * (mobile + preview iframe = environnement fragile)
 */
export function isMobilePreviewSafeMode(): boolean {
  return isPreviewIframe() && isMobile();
}

/**
 * Log conditionnel pour le debug Safe Mode
 */
export function logSafeMode(message: string, ...args: any[]) {
  if (isMobilePreviewSafeMode()) {
    console.log(`🛡️ [SafeMode] ${message}`, ...args);
  }
}
