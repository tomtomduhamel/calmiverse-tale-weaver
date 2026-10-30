import { useState, useRef, useCallback, useEffect } from 'react';
import { audioService } from '@/services/audioService';

// Référence globale au lecteur d'ambiance pour permettre un arrêt synchrone garanti (ex: notification Android / stopAllPlayback)
let globalBgAudioElement: HTMLAudioElement | null = null;
let isIntentionalBgPause = false;
let externalBgPauseListener: (() => void) | null = null;

export const setOnExternalBgPause = (cb: (() => void) | null) => {
  externalBgPauseListener = cb;
};

export const pauseGlobalBackgroundAudio = () => {
  if (globalBgAudioElement) {
    try {
      isIntentionalBgPause = true;
      globalBgAudioElement.pause();
    } catch {} finally {
      setTimeout(() => {
        isIntentionalBgPause = false;
      }, 100);
    }
  }
};

interface RobustAudioPlayerProps {
  soundDetails: any | null;
  musicEnabled: boolean;
  autoPlay?: boolean;
}

interface RobustAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  error: string | null;
  currentSoundId: string | null;
  diagnosticInfo?: any;
}

export const useRobustAudioPlayer = ({ 
  soundDetails, 
  musicEnabled, 
  autoPlay = false 
}: RobustAudioPlayerProps) => {
  const [state, setState] = useState<RobustAudioState>({
    isPlaying: false,
    isLoading: true,
    volume: 0.5,
    error: null,
    currentSoundId: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const updateState = useCallback((updates: Partial<RobustAudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      console.log("🎵 [RobustAudioPlayer] Nettoyage audio");
      isIntentionalBgPause = true;
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch {}
      if (globalBgAudioElement === audioRef.current) {
        globalBgAudioElement = null;
      }
      audioRef.current = null;
      setTimeout(() => {
        isIntentionalBgPause = false;
      }, 100);
    }
    isInitializedRef.current = false;
    retryCountRef.current = 0;
  }, []);

  const initializeAudio = useCallback(async () => {
    if (!soundDetails || !musicEnabled || !soundDetails.file_path) {
      console.log("🎵 [RobustAudioPlayer] Conditions non remplies pour l'initialisation");
      cleanupAudio();
      updateState({ error: null, isLoading: false });
      return;
    }

    if (isInitializedRef.current && state.currentSoundId === soundDetails.id) {
      console.log("🎵 [RobustAudioPlayer] Audio déjà initialisé pour ce son");
      return;
    }

    try {
      updateState({ isLoading: true, error: null });
      cleanupAudio();

      console.log(`🎵 [RobustAudioPlayer] Initialisation pour: ${soundDetails.title}`);
      
      const diagnostic = await audioService.runDiagnostic(soundDetails.file_path, 'story_sounds');
      updateState({ diagnosticInfo: diagnostic });

      if (!diagnostic.supabaseOk) {
        throw new Error('Connexion Supabase échouée');
      }

      const validatedUrl = await audioService.getValidatedAudioUrl(soundDetails.file_path, 'story_sounds');
      
      if (!validatedUrl) {
        const errorReason = diagnostic.audioUrl?.error || `Impossible de valider l'URL pour ${soundDetails.title}`;
        throw new Error(errorReason);
      }

      const audio = new Audio();
      audio.loop = true;
      audio.volume = state.volume;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';

      audio.addEventListener('loadstart', () => {
        console.log(`🎵 [RobustAudioPlayer] Début chargement: ${soundDetails.title}`);
      });

      audio.addEventListener('canplay', () => {
        console.log(`🎵 [RobustAudioPlayer] Audio prêt: ${soundDetails.title}`);
        updateState({ 
          isLoading: false, 
          currentSoundId: soundDetails.id,
          error: null 
        });
        
        if (autoPlay) {
          audio.play().catch(err => {
            console.error('🎵 [RobustAudioPlayer] Erreur auto-play:', err);
            updateState({ error: 'Lecture automatique impossible' });
          });
        }
      });

      audio.addEventListener('play', () => {
        console.log(`🎵 [RobustAudioPlayer] Lecture démarrée: ${soundDetails.title}`);
        updateState({ isPlaying: true, error: null });
      });

      audio.addEventListener('pause', () => {
        console.log(`🎵 [RobustAudioPlayer] Lecture pausée: ${soundDetails.title}`);
        updateState({ isPlaying: false });
        // Si la pause provient du volet de notification Android / OS et non d'un appel interne,
        // propager immédiatement l'arrêt au lecteur principal d'histoire !
        if (!isIntentionalBgPause && externalBgPauseListener) {
          externalBgPauseListener();
        }
      });

      audio.addEventListener('error', async (e) => {
        const mediaError = audio.error;
        console.error('🎵 [RobustAudioPlayer] Erreur audio:', {
          event: e,
          mediaError: {
            code: mediaError?.code,
            message: mediaError?.message
          },
          src: audio.currentSrc,
          retry: retryCountRef.current
        });

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`🎵 [RobustAudioPlayer] Tentative ${retryCountRef.current}/${maxRetries}`);
          
          audioService.clearCache();
          setTimeout(() => initializeAudio(), 1000 * retryCountRef.current);
          return;
        }

        const errorMsg = `Échec du chargement audio après ${maxRetries} tentatives`;
        updateState({ 
          error: errorMsg, 
          isLoading: false, 
          isPlaying: false 
        });
      });

      audioRef.current = audio;
      globalBgAudioElement = audio;
      audio.src = validatedUrl;
      isInitializedRef.current = true;

      console.log(`🎵 [RobustAudioPlayer] Audio initialisé avec URL: ${validatedUrl}`);

    } catch (error) {
      console.error('🎵 [RobustAudioPlayer] Erreur initialisation:', error);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🎵 [RobustAudioPlayer] Retry général ${retryCountRef.current}/${maxRetries}`);
        setTimeout(() => initializeAudio(), 2000 * retryCountRef.current);
        return;
      }

      updateState({ 
        error: `Erreur d'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        isLoading: false 
      });
    }
  }, [soundDetails, musicEnabled, autoPlay, state.volume, state.currentSoundId, cleanupAudio, updateState]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !musicEnabled) {
      console.log("🎵 [RobustAudioPlayer] Impossible de contrôler la lecture");
      return;
    }

    try {
      if (!audioRef.current.paused || state.isPlaying) {
        isIntentionalBgPause = true;
        audioRef.current.pause();
        setTimeout(() => {
          isIntentionalBgPause = false;
        }, 100);
      } else {
        audioRef.current.play().catch(err => {
          console.error('🎵 [RobustAudioPlayer] Erreur lecture:', err);
          updateState({ error: 'Erreur lors de la lecture' });
        });
      }
    } catch (error) {
      console.error('🎵 [RobustAudioPlayer] Erreur togglePlay:', error);
      updateState({ error: 'Erreur de contrôle audio' });
    }
  }, [state.isPlaying, musicEnabled, updateState]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      isIntentionalBgPause = true;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      updateState({ isPlaying: false });
      setTimeout(() => {
        isIntentionalBgPause = false;
      }, 100);
    }
  }, [updateState]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    updateState({ volume: clampedVolume });
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, [updateState]);

  const reinitialize = useCallback(() => {
    console.log("🎵 [RobustAudioPlayer] Réinitialisation forcée");
    retryCountRef.current = 0;
    audioService.clearCache();
    initializeAudio();
  }, [initializeAudio]);

  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    ...state,
    togglePlay,
    stopAudio,
    setVolume,
    reinitialize
  };
};
