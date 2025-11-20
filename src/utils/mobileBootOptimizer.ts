/**
 * 🚀 MOBILE BOOT OPTIMIZER
 * Détection précoce + stratégies d'accélération boot mobile
 */

export function isMobileDevice(): boolean {
  // Détection fiable mobile (pas juste screen width)
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

export function isLovableIframe(): boolean {
  try {
    return window.self !== window.top && 
           (window.location.hostname.includes('lovableproject') ||
            new URLSearchParams(window.location.search).has('forceHideBadge'));
  } catch {
    return true; // Cross-origin error = iframe
  }
}

export function shouldUseFastBoot(): boolean {
  return isMobileDevice() && isLovableIframe();
}

export function logBootMode() {
  const fastBoot = shouldUseFastBoot();
  console.log(`[BootOptimizer] Mode: ${fastBoot ? '🚀 FAST MOBILE' : '🖥️ STANDARD'}`, {
    isMobile: isMobileDevice(),
    isIframe: isLovableIframe(),
    userAgent: navigator.userAgent.slice(0, 50)
  });
}
