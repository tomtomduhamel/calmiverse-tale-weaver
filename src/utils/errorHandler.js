// Configuration de base
window.gptengineer = {
  config: {
    debug: true,
    retryDelay: 1000,
    maxRetries: 3,
    errorHandling: {
      ignorePatterns: [
        'cors',
        'feature',
        'ambient-light-sensor',
        'battery',
        'connection',
        'preload',
        'as',
        'link preloaded',
        'postMessage',
        'ResizeObserver loop',
        'Failed to execute \'postMessage\' on \'Window\''
      ]
    }
  }
};

// Fonction utilitaire pour vérifier si un objet est clonable
function isObjectClonable(obj) {
  try {
    structuredClone(obj);
    return true;
  } catch (e) {
    return false;
  }
}

// Fonction de sérialisation sécurisée
function safeSerialize(obj, depth = 0, maxDepth = 5) {
  if (depth > maxDepth) {
    return { _type: "MaxDepthReached", value: "[Max depth of " + maxDepth + " reached]" };
  }

  if (!obj) return null;
  
  try {
    // Handle special types
    if (obj instanceof Error) {
      return {
        _type: "Error",
        name: obj.name,
        message: obj.message,
        stack: obj.stack
      };
    }

    if (obj instanceof Set) {
      return {
        _type: "Set",
        value: { values: Array.from(obj).map(v => safeSerialize(v, depth + 1, maxDepth)) }
      };
    }

    if (obj instanceof Map) {
      return {
        _type: "Map",
        value: { entries: Array.from(obj.entries()).map(([k, v]) => [
          safeSerialize(k, depth + 1, maxDepth),
          safeSerialize(v, depth + 1, maxDepth)
        ])}
      };
    }

    if (typeof obj === 'function') {
      return {
        _type: "function",
        name: obj.name || "anonymous"
      };
    }

    if (typeof obj === 'undefined') {
      return {
        _type: "undefined",
        value: "undefined"
      };
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => safeSerialize(item, depth + 1, maxDepth));
    }

    // Handle regular objects
    const clean = {};
    const seen = new WeakSet();

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            clean[key] = {
              message: "[Circular Reference to " + (value.constructor ? value.constructor.name : 'root') + "]"
            };
            continue;
          }
          seen.add(value);
        }

        clean[key] = safeSerialize(value, depth + 1, maxDepth);
      }
    }
    
    return clean;
  } catch (e) {
    console.warn('Serialization failed:', e);
    return {
      error: 'Object serialization failed',
      type: typeof obj,
      preview: String(obj).slice(0, 100)
    };
  }
}

// Gestionnaire d'erreurs amélioré
const errorHandler = {
  lastError: null,
  lastErrorTime: 0,
  errorCache: new Set(),
  
  handle(error, source) {
    try {
      const now = Date.now();
      const errorKey = `${error.message}:${source}`;

      // Vérifier si l'erreur est déjà dans le cache (5 secondes)
      if (this.errorCache.has(errorKey) && (now - this.lastErrorTime) < 5000) {
        return false;
      }

      this.lastError = error.message;
      this.lastErrorTime = now;
      this.errorCache.add(errorKey);

      // Nettoyer le cache après 5 secondes
      setTimeout(() => {
        this.errorCache.delete(errorKey);
      }, 5000);

      if (this.isNonCritical(error)) {
        return false;
      }

      const serializedError = safeSerialize(error);
      console.error(`[${source}] Error:`, serializedError);
      
      return true;
    } catch (e) {
      console.warn('Error handler failed:', e);
      return false;
    }
  },

  isNonCritical(error) {
    try {
      const { ignorePatterns } = window.gptengineer.config.errorHandling;
      const errorMessage = (error?.message || '').toLowerCase();
      return ignorePatterns.some(pattern => 
        errorMessage.includes(pattern.toLowerCase())
      );
    } catch {
      return true;
    }
  }
};

// Initialisation des gestionnaires d'erreurs
function initializeErrorHandlers() {
  let errorTimeout;

  window.addEventListener('error', function(event) {
    if (event.target?.tagName === 'LINK' || event.target?.tagName === 'SCRIPT') {
      return false;
    }
    
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }

    errorTimeout = setTimeout(() => {
      errorHandler.handle(event.error || event, 'Global Error');
    }, 250);
    
    return false;
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    errorHandler.handle(event.reason, 'Unhandled Promise');
    event.preventDefault();
  });

  window.addEventListener('load', function() {
    console.log('Application initialized with enhanced error handling');
  });
}

// Exporter les fonctions nécessaires
export { initializeErrorHandlers };