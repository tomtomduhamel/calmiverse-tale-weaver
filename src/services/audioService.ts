
import { supabase } from '@/integrations/supabase/client';

interface AudioValidationResult {
  isValid: boolean;
  url: string;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

interface CachedAudioUrl {
  url:string;
  validatedAt: number;
  isValid: boolean;
}

class AudioService {
  private urlCache = new Map<string, CachedAudioUrl>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly REQUEST_TIMEOUT = 10000; // 10 secondes

  /**
   * Valide une URL audio avec des vérifications approfondies
   */
  async validateAudioUrl(filePath: string, bucket: string = 'story_sounds'): Promise<AudioValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🎵 [AudioService] Validation de l'URL pour: ${filePath} (bucket: ${bucket})`);
      
      // Construire l'URL publique via Supabase ou utiliser l'URL directe
      let url = filePath;
      if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
        const cleanPath = filePath.replace(/^\/+/, '').replace(new RegExp(`^${bucket}/`), '');
        const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
        url = data.publicUrl;
      }
      
      if (!url) {
        throw new Error('Impossible de construire l\'URL publique');
      }
      
      console.log(`🎵 [AudioService] URL générée: ${url}`);
      
      // Tester la connectivité avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          method: 'HEAD', // Plus rapide qu'un GET complet
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        console.log(`🎵 [AudioService] Réponse HTTP: ${response.status} en ${responseTime}ms`);
        
        if (response.ok) {
          // Vérifier le content-type si disponible
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.startsWith('audio/') && !contentType.startsWith('video/') && !contentType.includes('octet-stream')) {
            console.warn(`🎵 [AudioService] Content-Type suspect: ${contentType}`);
          }
          
          return {
            isValid: true,
            url,
            responseTime
          };
        } else {
          return {
            isValid: false,
            url,
            error: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
            responseTime
          };
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (fetchError.name === 'AbortError') {
          return {
            isValid: false,
            url,
            error: `Timeout après ${this.REQUEST_TIMEOUT}ms`,
            responseTime
          };
        }
        
        return {
          isValid: false,
          url,
          error: `Erreur réseau: ${fetchError.message}`,
          responseTime
        };
      }
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error(`🎵 [AudioService] Erreur validation:`, error);
      
      return {
        isValid: false,
        url: '',
        error: `Erreur service: ${error.message}`,
        responseTime
      };
    }
  }

  /**
   * Obtient une URL audio validée avec cache
   */
  async getValidatedAudioUrl(filePath: string, bucket: string = 'story_sounds'): Promise<string | null> {
    const cacheKey = `${bucket}:${filePath}`;
    // Vérifier le cache d'abord
    const cached = this.urlCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.validatedAt) < this.CACHE_DURATION && cached.isValid) {
      console.log(`🎵 [AudioService] URL en cache valide pour: ${filePath}`);
      return cached.url;
    }
    
    // Valider l'URL
    const validation = await this.validateAudioUrl(filePath, bucket);
    
    // Mettre en cache le résultat
    this.urlCache.set(cacheKey, {
      url: validation.url,
      validatedAt: now,
      isValid: validation.isValid
    });
    
    if (validation.isValid) {
      console.log(`🎵 [AudioService] URL validée avec succès: ${validation.url}`);
      return validation.url;
    } else {
      console.error(`🎵 [AudioService] URL invalide:`, validation.error);
      return null;
    }
  }

  /**
   * Nettoie le cache des URLs
   */
  clearCache(): void {
    console.log(`🎵 [AudioService] Nettoyage du cache (${this.urlCache.size} entrées)`);
    this.urlCache.clear();
  }

  /**
   * Diagnostic simplifié du système audio
   */
  async runDiagnostic(filePath?: string, bucket: string = 'story_sounds'): Promise<{
    supabaseOk: boolean;
    audioUrl?: AudioValidationResult;
    cacheStats: {
      size: number;
      validEntries: number;
    };
  }> {
    console.log(`🎵 [AudioService] Démarrage diagnostic simplifié`);
    
    const supabaseOk = await this.validateSupabaseConnection();
    
    let audioUrl;
    if (filePath) {
      audioUrl = await this.validateAudioUrl(filePath, bucket);
    }
    
    const now = Date.now();
    let validEntries = 0;
    for (const cached of this.urlCache.values()) {
      if (cached.isValid && (now - cached.validatedAt) < this.CACHE_DURATION) {
        validEntries++;
      }
    }
    
    const diagnostic = {
      supabaseOk,
      audioUrl,
      cacheStats: {
        size: this.urlCache.size,
        validEntries
      }
    };
    
    console.log(`🎵 [AudioService] Diagnostic simplifié terminé:`, diagnostic);
    return diagnostic;
  }

  private async validateSupabaseConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      return !error && Array.isArray(data);
    } catch {
      return false;
    }
  }
}

// Instance singleton
export const audioService = new AudioService();
