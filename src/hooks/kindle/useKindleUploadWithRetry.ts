
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  timeoutMs: number;
}

interface UploadProgress {
  step: 'connecting' | 'uploading' | 'processing' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeoutMs: 30000
};

export const useKindleUploadWithRetry = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateProgress = useCallback((update: Partial<UploadProgress>) => {
    setUploadProgress(prev => prev ? { ...prev, ...update } : null);
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const calculateBackoffDelay = (attempt: number, config: RetryConfig): number => {
    const exponentialDelay = config.baseDelay * Math.pow(2, attempt - 1);
    const jitterDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
    return Math.min(jitterDelay, config.maxDelay);
  };

  const uploadWithTimeout = async (content: string, filename: string, timeoutMs: number) => {
    return Promise.race([
      supabase.functions.invoke('upload-epub', {
        body: { content, filename }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
      )
    ]);
  };

  const uploadEpubWithRetry = useCallback(async (
    content: string, 
    filename: string,
    config: Partial<RetryConfig> = {}
  ) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    setIsUploading(true);
    
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        setUploadProgress({
          step: 'connecting',
          progress: 10,
          message: `Tentative ${attempt}/${finalConfig.maxAttempts} - Connexion au serveur...`,
          attempt,
          maxAttempts: finalConfig.maxAttempts
        });

        // Validation préalable
        if (!content || content.length < 50) {
          throw new Error('Contenu insuffisant pour générer un EPUB');
        }

        updateProgress({
          step: 'uploading',
          progress: 30,
          message: 'Envoi du contenu...'
        });

        const result = await uploadWithTimeout(content, filename, finalConfig.timeoutMs);

        updateProgress({
          step: 'processing',
          progress: 70,
          message: 'Génération de l\'EPUB...'
        });

        if (result.error) {
          throw new Error(result.error.message || 'Erreur lors de la génération EPUB');
        }

        if (!result.data?.url) {
          throw new Error('Aucune URL retournée par le serveur');
        }

        updateProgress({
          step: 'finalizing',
          progress: 90,
          message: 'Finalisation...'
        });

        // Vérification de l'URL générée
        try {
          new URL(result.data.url);
        } catch {
          throw new Error('URL générée invalide');
        }

        updateProgress({
          step: 'completed',
          progress: 100,
          message: 'EPUB généré avec succès!'
        });

        console.log(`✅ [KindleRetry] Succès après ${attempt} tentative(s):`, result.data.url);
        return result.data.url;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ [KindleRetry] Tentative ${attempt}/${finalConfig.maxAttempts} échouée:`, lastError.message);

        if (attempt < finalConfig.maxAttempts) {
          const delayMs = calculateBackoffDelay(attempt, finalConfig);
          
          updateProgress({
            step: 'error',
            progress: (attempt / finalConfig.maxAttempts) * 50,
            message: `Échec tentative ${attempt}. Nouvelle tentative dans ${Math.round(delayMs/1000)}s...`
          });

          await delay(delayMs);
        }
      }
    }

    // Toutes les tentatives ont échoué
    updateProgress({
      step: 'error',
      progress: 0,
      message: `Échec après ${finalConfig.maxAttempts} tentatives: ${lastError?.message || 'Erreur inconnue'}`
    });

    setIsUploading(false);
    throw lastError || new Error('Toutes les tentatives ont échoué');

  }, [updateProgress]);

  const resetProgress = useCallback(() => {
    setUploadProgress(null);
    setIsUploading(false);
  }, []);

  return {
    uploadProgress,
    isUploading,
    uploadEpubWithRetry,
    resetProgress
  };
};
