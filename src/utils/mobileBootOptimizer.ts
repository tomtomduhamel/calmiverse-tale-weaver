/**
 * 🚀 MOBILE BOOT OPTIMIZER
 * Détection précoce + stratégies d'accélération boot mobile
 */

export function isMobileDevice(): boolean {
  // Détection fiable mobile avec exclusions desktop explicites
  const ua = navigator.userAgent;
  
  // Exclusions explicites desktop (Windows, Mac, Linux, Chrome OS)
  if (/Windows NT|Macintosh|Mac OS X|Linux x86_64|CrOS/i.test(ua)) {
    return false;
  }
  
  // Détection mobile positive
  const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  // Validation supplémentaire : écran petit OU support tactile
  const hasSmallScreen = window.innerWidth <= 768;
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Mobile = UA mobile ET (petit écran OU tactile)
  return isMobileUA && (hasSmallScreen || hasTouchScreen);
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
  const isMobile = isMobileDevice();
  const isIframe = isLovableIframe();
  
  console.log(`[BootOptimizer] Mode: ${fastBoot ? '🚀 FAST MOBILE' : '🖥️ STANDARD'}`, {
    isMobile,
    isIframe,
    fastBootEnabled: fastBoot,
    userAgent: navigator.userAgent.slice(0, 80),
    screen: `${window.innerWidth}x${window.innerHeight}`,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hostname: window.location.hostname
  });
  
  // Warning si détection incohérente
  if (isMobile && window.innerWidth > 1024) {
    console.warn('[BootOptimizer] ⚠️ Mobile détecté mais large écran - vérifier détection');
  }
}
