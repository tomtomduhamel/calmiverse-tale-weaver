
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  modelId?: string;
}

interface TTSCache {
  [key: string]: string; // hash du texte -> base64 audio
}

export const useElevenLabsTTS = (options: UseElevenLabsTTSOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<TTSCache>({});
  const { toast } = useToast();

  const {
    voiceId = '9BWtsMINqrJLrRacOk9x', // Aria par défaut
    modelId = 'eleven_multilingual_v2'
  } = options;

  // Génère une clé de cache basée sur le texte et les paramètres
  const getCacheKey = useCallback((text: string) => {
    const normalizedText = text.trim().toLowerCase();
    return `${voiceId}-${modelId}-${btoa(normalizedText).substring(0, 20)}`;
  }, [voiceId, modelId]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
    console.log('🗑️ Cache TTS vidé');
    toast({
      title: "Cache vidé",
      description: "Le cache des audios générés a été effacé",
    });
  }, [toast]);

  const generateAndPlaySpeech = useCallback(async (text: string, showProgressToast: boolean = true) => {
    if (!text.trim()) {
      toast({
        title: "Erreur",
        description: "Le texte ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    // Si déjà en train de jouer, arrêter
    if (isPlaying) {
      stopAudio();
      return;
    }

    const cacheKey = getCacheKey(text);
    
    // Vérifier le cache d'abord
    if (cacheRef.current[cacheKey]) {
      console.log('📦 Audio trouvé dans le cache');
      try {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(cacheRef.current[cacheKey]), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          URL.revokeObjectURL(audioUrl);
        };
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        
        await audio.play();
        
        if (showProgressToast) {
          toast({
            title: "Lecture depuis le cache",
            description: "Audio récupéré du cache local",
          });
        }
        return;
      } catch (error) {
        console.error('❌ Erreur lecture cache:', error);
        delete cacheRef.current[cacheKey];
      }
    }

    setIsLoading(true);
    setError(null);
    setGenerationProgress('Connexion au service audio...');

    try {
      console.log('🎙️ Début génération ElevenLabs...', { 
        textLength: text.length, 
        voiceId, 
        modelId 
      });

      if (showProgressToast) {
        toast({
          title: "Génération en cours",
          description: "Création de l'audio en cours...",
        });
      }

      setGenerationProgress('Envoi du texte...');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text,
          voiceId,
          modelId 
        }
      });

      console.log('📡 Réponse reçue:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase fonction:', error);
        throw new Error(`Erreur de connexion: ${error.message}`);
      }

      if (!data?.success || !data?.audioContent) {
        console.error('❌ Réponse invalide:', data);
        throw new Error(data?.error || 'Réponse invalide du service de synthèse vocale');
      }

      // Mettre en cache l'audio généré
      cacheRef.current[cacheKey] = data.audioContent;
      console.log('💾 Audio mis en cache');

      setGenerationProgress('Préparation de la lecture...');

      // Créer l'URL audio à partir du base64
      console.log('🎵 Création de l\'audio blob...');
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Créer et configurer l'élément audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Gestionnaires d'événements audio
      audio.onloadstart = () => {
        console.log('🔄 Chargement audio démarré');
        setGenerationProgress('Chargement audio...');
      };
      
      audio.oncanplay = () => {
        console.log('✅ Audio prêt à jouer');
        setIsLoading(false);
        setGenerationProgress('');
      };
      
      audio.onplay = () => {
        console.log('▶️ Lecture audio démarrée');
        setIsPlaying(true);
      };
      
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      
      audio.onended = () => {
        console.log('⏹️ Lecture audio terminée');
        setIsPlaying(false);
        setProgress(0);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (e) => {
        console.error('💥 Erreur lecture audio:', e);
        setIsPlaying(false);
        setProgress(0);
        setError('Erreur lors de la lecture audio');
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio généré",
          variant: "destructive",
        });
      };

      // Lancer la lecture
      await audio.play();

      if (showProgressToast) {
        toast({
          title: "Lecture démarrée",
          description: data.segments 
            ? `Audio généré (${data.processedTextLength}/${data.originalTextLength} caractères)`
            : "Audio généré avec succès",
        });
      }

    } catch (error: any) {
      console.error('💥 Erreur synthèse vocale:', error);
      const errorMessage = error.message || 'Erreur lors de la génération de la voix';
      setError(errorMessage);
      
      // Messages d'erreur spécifiques
      let userMessage = "Impossible de générer l'audio";
      if (errorMessage.includes('Clé API') || errorMessage.includes('invalide')) {
        userMessage = "Erreur de configuration audio. Contactez le support.";
      } else if (errorMessage.includes('quota') || errorMessage.includes('limite')) {
        userMessage = "Limite audio atteinte. Réessayez ultérieurement.";
      } else if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
        userMessage = "La génération a pris trop de temps. Essayez un texte plus court.";
      } else if (errorMessage.includes('connexion')) {
        userMessage = "Problème de connexion. Vérifiez votre réseau.";
      }
      
      toast({
        title: "Erreur de synthèse vocale",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setGenerationProgress('');
    }
  }, [voiceId, modelId, isPlaying, stopAudio, toast, getCacheKey]);

  return {
    generateAndPlaySpeech,
    stopAudio,
    clearCache,
    isLoading,
    isPlaying,
    error,
    progress,
    generationProgress,
    cacheSize: Object.keys(cacheRef.current).length
  };
};
