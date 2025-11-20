/**
 * Helper pour détecter si l'application s'exécute dans un iframe de prévisualisation
 */

export function isPreviewIframe(): boolean {
  try {
    // Vérifier si on est dans un iframe
    if (window.self !== window.top) {
      return true;
    }
    return false;
  } catch (e) {
    // En cas d'erreur d'accès cross-origin, on assume qu'on est dans un iframe
    return true;
  }
}
