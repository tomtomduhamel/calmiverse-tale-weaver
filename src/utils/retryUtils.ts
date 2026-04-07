/**
 * Système de retry intelligent pour les appels réseau avec timeout
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeoutMs?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 2000, // 2 secondes
  maxDelay: 30000, // 30 secondes max
  timeoutMs: 300000, // 5 minutes
  retryCondition: (error: any) => {
    // Retry sur timeout ou erreur réseau, pas sur erreur HTTP 4xx
    const message = error?.message?.toLowerCase() || '';
    return message.includes('timeout') || 
           message.includes('network') || 
           message.includes('connexion') ||
           message.includes('délai') ||
           message.includes('pattern') ||
           message.includes('erreur temporaire') ||
           error?.name === 'AbortError' ||
           error?.name === 'NetworkError';
  }
};

/**
 * Fonction de retry avec délai exponentiel
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`[RetryUtils] Tentative ${attempt + 1}/${opts.maxRetries + 1}`);
      
      if (attempt > 0) {
        const delay = Math.min(opts.baseDelay * Math.pow(2, attempt - 1), opts.maxDelay);
        console.log(`[RetryUtils] Attente de ${delay}ms avant nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await operation();
      
      if (attempt > 0) {
        console.log(`[RetryUtils] ✅ Succès après ${attempt + 1} tentatives`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`[RetryUtils] ❌ Tentative ${attempt + 1} échouée:`, error?.message);
      
      // Si c'est la dernière tentative ou si l'erreur ne doit pas être retryée
      if (attempt >= opts.maxRetries || !opts.retryCondition(error)) {
        console.error(`[RetryUtils] 🚫 Abandon après ${attempt + 1} tentatives`);
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Wrapper pour les appels fetch avec retry automatique
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { fetchWithTimeout } = await import('@/utils/errorHandling/networkErrorHandler');
  
  return retryWithBackoff(
    () => fetchWithTimeout(url, options, retryOptions.timeoutMs),
    retryOptions
  );
}

export function getErrorMessage(error: any, context: string = ''): string {
  const message = error?.message?.toLowerCase() || '';
  const actionContext = context || 'l\'action en cours';
  
  if (message.includes('timeout') || message.includes('délai')) {
    return `La ${actionContext} prend un peu plus de temps que prévu. Le système est peut-être surchargé, mais ne vous inquiétez pas, cela devrait s'améliorer rapidement !`;
  }
  
  if (message.includes('network') || message.includes('connexion') || message.includes('failed to fetch')) {
    return `Problème de connexion avec nos serveurs pour la ${actionContext}. Vérifiez votre connexion internet et réessayez.`;
  }
  
  // Remplacement global pour toutes les autres erreurs (403, 500, JWT, Edge Function, etc.)
  // On cache complètement l'erreur technique à l'utilisateur final.
  return `Une petite anomalie est survenue lors de la ${actionContext}. Nos équipes techniques sont déjà dessus pour résoudre ce problème ! Veuillez réessayer d'ici quelques minutes.`;
}