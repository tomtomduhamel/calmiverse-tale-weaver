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
        'ResizeObserver loop'
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
function safeSerialize(obj) {
  if (!obj) return null;
  
  try {
    if (isObjectClonable(obj)) {
      return structuredClone(obj);
    }

    const clean = {};
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (value instanceof Error) {
          clean[key] = {
            name: value.name,
            message: value.message,
            stack: value.stack
          };
        } else if (value instanceof Request || value instanceof Response) {
          clean[key] = `[${value.constructor.name}]`;
        } else if (typeof value === 'function') {
          clean[key] = `[Function: ${value.name || 'anonymous'}]`;
        } else if (typeof value === 'object' && value !== null) {
          clean[key] = safeSerialize(value);
        } else {
          clean[key] = value;
        }
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
  
  handle(error, source) {
    try {
      const now = Date.now();
      if (this.lastError === error.message && (now - this.lastErrorTime) < 1000) {
        return false;
      }
      
      this.lastError = error.message;
      this.lastErrorTime = now;

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
      return ignorePatterns.some(pattern => errorMessage.includes(pattern.toLowerCase()));
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