
import { useCallback, useEffect } from 'react';

interface UseAudioInitializationProps {
  soundDetails: any | null;
  musicEnabled: boolean;
  autoPlay: boolean;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isInitializedRef: React.MutableRefObject<boolean>;
  state: any;
  updateState: (updates: any) => void;
}

export const useAudioInitialization = ({
  soundDetails,
  musicEnabled,
  autoPlay,
  audioRef,
  isInitializedRef,
  state,
  updateState
}: UseAudioInitializationProps) => {

  const buildAudioUrl = useCallback((filePath: string): string => {
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('URL Supabase non configurée');
    }
    
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${supabaseUrl}/storage/v1/object/public/sound-backgrounds/${cleanPath}`;
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('loadstart', () => {});
      audioRef.current.removeEventListener('canplay', () => {});
      audioRef.current.removeEventListener('play', () => {});
      audioRef.current.removeEventListener('pause', () => {});
      audioRef.current.removeEventListener('error', () => {});
      audioRef.current.src = '';
      audioRef.current = null;
    }
    isInitializedRef.current = false;
  }, [audioRef, isInitializedRef]);

  const initializeAudio = useCallback(async () => {
    if (!soundDetails || !musicEnabled || !soundDetails.file_path) {
      console.log("🎵 Conditions non remplies pour initialiser l'audio");
      cleanupAudio();
      updateState({ error: null, isLoading: false });
      return;
    }

    if (isInitializedRef.current && state.currentSoundId === soundDetails.id) {
      console.log("🎵 Audio déjà initialisé pour ce son");
      return;
    }

    try {
      updateState({ isLoading: true, error: null });
      
      cleanupAudio();

      const audioUrl = buildAudioUrl(soundDetails.file_path);
      console.log("🎵 Initialisation audio avec URL:", audioUrl);

      const audio = new Audio();
      audio.loop = true;
      audio.volume = state.volume;
      audio.preload = 'auto';

      audio.addEventListener('loadstart', () => {
        console.log(`🎵 Début du chargement: ${soundDetails.title}`);
      });

      audio.addEventListener('canplay', () => {
        console.log(`🎵 Audio prêt: ${soundDetails.title}`);
        updateState({ isLoading: false, currentSoundId: soundDetails.id });
        
        if (autoPlay) {
          audio.play().catch(err => {
            console.error('🎵 Erreur auto-play:', err);
            updateState({ error: 'Lecture automatique impossible' });
          });
        }
      });

      audio.addEventListener('play', () => {
        console.log(`🎵 Lecture démarrée: ${soundDetails.title}`);
        updateState({ isPlaying: true });
      });

      audio.addEventListener('pause', () => {
        console.log(`🎵 Lecture mise en pause: ${soundDetails.title}`);
        updateState({ isPlaying: false });
      });

      audio.addEventListener('error', (e) => {
        console.error('🎵 Erreur audio:', e);
        const errorMsg = `Impossible de charger le fichier audio: ${soundDetails.title}`;
        updateState({ 
          error: errorMsg, 
          isLoading: false, 
          isPlaying: false 
        });
      });

      audioRef.current = audio;
      audio.src = audioUrl;
      isInitializedRef.current = true;

    } catch (error) {
      console.error('🎵 Erreur initialisation audio:', error);
      updateState({ 
        error: `Erreur d'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        isLoading: false 
      });
    }
  }, [soundDetails, musicEnabled, autoPlay, state.volume, state.currentSoundId, buildAudioUrl, cleanupAudio, updateState, audioRef, isInitializedRef]);

  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    initializeAudio,
    cleanupAudio
  };
};
