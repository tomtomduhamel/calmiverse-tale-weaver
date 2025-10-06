/**
 * Helper pour détecter si l'application s'exécute dans un iframe de prévisualisation
 * Utilisé pour désactiver les opérations Service Worker en environnement preview
 */

export function isPreviewIframe(): boolean {
  try {
    // Vérifier si on est dans un iframe
    if (window.self !== window.top) {
      // Vérifier si c'est un iframe Lovable
      const params = new URLSearchParams(window.location.search);
      const isLovablePreview = params.has('preview') || 
                               window.location.hostname.includes('lovable') ||
                               window.location.hostname.includes('gptengineer');
      
      return isLovablePreview;
    }
    return false;
  } catch (e) {
    // En cas d'erreur d'accès cross-origin, on assume qu'on est dans un iframe
    return true;
  }
}
