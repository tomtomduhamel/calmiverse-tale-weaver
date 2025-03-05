
/**
 * Enhanced postMessage handling with safe cloning
 * Prevents DataCloneError and similar serialization issues
 */

/**
 * Safely simplifies an object for postMessage operations
 * Prevents DataCloneError by creating serializable versions of complex objects
 */
function simplifyObject(obj, depth = 0) {
  try {
    // Prevent infinite recursion
    if (depth > 2) return "[Object depth limit]";
    
    // Handle null or primitive types directly
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Handle special objects that may cause cloning issues
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof RegExp) return obj.toString();
    if (obj instanceof Error) return { message: obj.message, name: obj.name };
    if (typeof obj.toJSON === 'function') return obj.toJSON();
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => {
        try {
          return simplifyObject(item, depth + 1);
        } catch (e) {
          return "[Non-serializable value]";
        }
      });
    }
    
    // For regular objects, sanitize them by copying only serializable properties
    const result = {};
    
    for (const key in obj) {
      try {
        const value = obj[key];
        
        // Skip functions, DOM nodes, and other non-serializable items
        if (typeof value === 'function') {
          result[key] = "[Function]";
        } else if (value instanceof Node) {
          result[key] = "[DOM Node]";
        } else if (value instanceof Error) {
          result[key] = { message: value.message, name: value.name };
        } else if (value instanceof Request || 
                  value instanceof Response || 
                  value instanceof ReadableStream) {
          result[key] = "[Non-serializable Object]";
        } else if (value === window || 
                  value === document || 
                  (typeof value === 'object' && value !== null && 'window' in value)) {
          result[key] = "[Window Reference]";
        } else {
          // Pour les autres objets, on les simplifie récursivement
          result[key] = simplifyObject(value, depth + 1);
        }
      } catch (e) {
        result[key] = "[Non-serializable value]";
      }
    }
    
    return result;
  } catch (e) {
    // En cas d'erreur, retourner un objet simple plutôt que de planter
    return { error: "Object simplification failed" };
  }
}

/**
 * Setup safe postMessage patching to prevent DataCloneError
 */
export function setupSafePostMessage() {
  console.log("Setting up safe postMessage handling");
  
  const originalPostMessage = window.postMessage;
  window.postMessage = function safePostMessage(message, targetOrigin, transfer) {
    try {
      // Simple primitives can be passed directly
      if (message === null || 
          typeof message === 'string' || 
          typeof message === 'number' || 
          typeof message === 'boolean') {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      }
      
      // For objects, create a simplified version that can be safely cloned
      let safeMessage;
      try {
        safeMessage = JSON.parse(JSON.stringify(message));
      } catch (jsonError) {
        console.warn('JSON stringify failed, creating simplified message', jsonError);
        safeMessage = simplifyObject(message);
      }
      
      return originalPostMessage.call(this, safeMessage, targetOrigin, transfer);
    } catch (error) {
      // Si nous rencontrons encore une erreur, la supprimer silencieusement
      console.warn('PostMessage error suppressed:', error.message);
      // Ne pas lever d'erreur qui pourrait interrompre l'exécution
      return undefined;
    }
  };
}
