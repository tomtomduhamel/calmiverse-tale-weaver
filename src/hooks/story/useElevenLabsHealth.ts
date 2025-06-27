
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsHealthStatus {
  isHealthy: boolean;
  secretConfigured: boolean;
  apiKeyValid: boolean;
  lastChecked: Date | null;
  errorMessage: string | null;
}

export const useElevenLabsHealth = () => {
  const [healthStatus, setHealthStatus] = useState<ElevenLabsHealthStatus>({
    isHealthy: false,
    secretConfigured: false,
    apiKeyValid: false,
    lastChecked: null,
    errorMessage: null
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkElevenLabsHealth = useCallback(async (): Promise<ElevenLabsHealthStatus> => {
    setIsChecking(true);
    
    try {
      console.log('🔍 [ElevenLabsHealth] Vérification de la santé ElevenLabs...');
      
      // Test de base - ping
      const { data: pingData, error: pingError } = await supabase.functions.invoke('tts-elevenlabs', {
        body: { ping: true }
      });

      if (pingError) {
        console.error('❌ [ElevenLabsHealth] Ping échoué:', pingError);
        const status: ElevenLabsHealthStatus = {
          isHealthy: false,
          secretConfigured: false,
          apiKeyValid: false,
          lastChecked: new Date(),
          errorMessage: `Ping échoué: ${pingError.message}`
        };
        setHealthStatus(status);
        return status;
      }

      console.log('✅ [ElevenLabsHealth] Ping réussi');

      // Test de connectivité API avec la clé
      const { data: connectionData, error: connectionError } = await supabase.functions.invoke('tts-elevenlabs', {
        body: { testConnection: true }
      });

      if (connectionError) {
        console.error('❌ [ElevenLabsHealth] Test de connexion échoué:', connectionError);
        const status: ElevenLabsHealthStatus = {
          isHealthy: false,
          secretConfigured: true, // Le ping a fonctionné
          apiKeyValid: false,
          lastChecked: new Date(),
          errorMessage: `Connexion API échouée: ${connectionError.message}`
        };
        setHealthStatus(status);
        return status;
      }

      if (!connectionData?.success) {
        console.error('❌ [ElevenLabsHealth] Réponse de connexion invalide:', connectionData);
        const status: ElevenLabsHealthStatus = {
          isHealthy: false,
          secretConfigured: true,
          apiKeyValid: false,
          lastChecked: new Date(),
          errorMessage: connectionData?.message || 'Réponse de connexion invalide'
        };
        setHealthStatus(status);
        return status;
      }

      console.log('🎉 [ElevenLabsHealth] Santé complète confirmée');
      const status: ElevenLabsHealthStatus = {
        isHealthy: true,
        secretConfigured: true,
        apiKeyValid: true,
        lastChecked: new Date(),
        errorMessage: null
      };
      setHealthStatus(status);
      return status;

    } catch (error: any) {
      console.error('💥 [ElevenLabsHealth] Exception lors de la vérification:', error);
      const status: ElevenLabsHealthStatus = {
        isHealthy: false,
        secretConfigured: false,
        apiKeyValid: false,
        lastChecked: new Date(),
        errorMessage: `Exception: ${error.message}`
      };
      setHealthStatus(status);
      return status;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getHealthSummary = useCallback((): string => {
    if (!healthStatus.lastChecked) return 'Non testé';
    if (healthStatus.isHealthy) return '✅ Fonctionnel';
    if (!healthStatus.secretConfigured) return '⚠️ Secret manquant';
    if (!healthStatus.apiKeyValid) return '❌ Clé API invalide';
    return '❌ Problème détecté';
  }, [healthStatus]);

  return {
    healthStatus,
    isChecking,
    checkElevenLabsHealth,
    getHealthSummary
  };
};
