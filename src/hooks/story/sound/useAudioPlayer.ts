
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  error: string | null;
  currentSoundId: string | null;
}

interface AudioPlayerProps {
  soundDetails: any | null;
  musicEnabled: boolean;
  autoPlay?: boolean;
}

/**
 * Hook centralisé pour la gestion de l'audio avec une seule instance
 */
export const useAudioPlayer = ({ soundDetails, musicEnabled, autoPlay = false }: AudioPlayerProps) => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    volume: 0.5,
    error: null,
    currentSoundId: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  // Fonction pour construire l'URL complète du fichier audio
  const buildAudioUrl = useCallback((filePath: string): string => {
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // Construire l'URL Supabase pour le fichier
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('URL Supabase non configurée');
    }
    
    // Nettoyer le chemin du fichier
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    return `${supabaseUrl}/storage/v1/object/public/sound-backgrounds/${cleanPath}`;
  }, []);

  // Nettoyer l'audio existant
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
  }, []);

  // Initialiser l'audio
  const initializeAudio = useCallback(async () => {
    if (!soundDetails || !musicEnabled || !soundDetails.file_path) {
      console.log("🎵 Conditions non remplies pour initialiser l'audio:", {
        soundDetails: !!soundDetails,
        musicEnabled,
        filePath: soundDetails?.file_path
      });
      cleanupAudio();
      setState(prev => ({ ...prev, error: null, isLoading: false }));
      return;
    }

    if (isInitializedRef.current && state.currentSoundId === soundDetails.id) {
      console.log("🎵 Audio déjà initialisé pour ce son");
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
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
        setState(prev => ({ ...prev, isLoading: false, currentSoundId: soundDetails.id }));
        
        if (autoPlay) {
          audio.play().catch(err => {
            console.error('🎵 Erreur auto-play:', err);
            setState(prev => ({ ...prev, error: 'Lecture automatique impossible' }));
          });
        }
      });

      audio.addEventListener('play', () => {
        console.log(`🎵 Lecture démarrée: ${soundDetails.title}`);
        setState(prev => ({ ...prev, isPlaying: true }));
      });

      audio.addEventListener('pause', () => {
        console.log(`🎵 Lecture mise en pause: ${soundDetails.title}`);
        setState(prev => ({ ...prev, isPlaying: false }));
      });

      audio.addEventListener('error', (e) => {
        console.error('🎵 Erreur audio:', e);
        const errorMsg = `Impossible de charger le fichier audio: ${soundDetails.title}`;
        setState(prev => ({ 
          ...prev, 
          error: errorMsg, 
          isLoading: false, 
          isPlaying: false 
        }));
      });

      audioRef.current = audio;
      audio.src = audioUrl;
      isInitializedRef.current = true;

    } catch (error) {
      console.error('🎵 Erreur initialisation audio:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Erreur d'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        isLoading: false 
      }));
    }
  }, [soundDetails, musicEnabled, autoPlay, state.volume, state.currentSoundId, buildAudioUrl, cleanupAudio]);

  // Contrôler la lecture
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !musicEnabled) {
      console.log("🎵 Impossible de contrôler la lecture - audio non disponible");
      return;
    }

    try {
      if (state.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('🎵 Erreur lecture:', err);
          setState(prev => ({ ...prev, error: 'Erreur lors de la lecture' }));
        });
      }
    } catch (error) {
      console.error('🎵 Erreur togglePlay:', error);
      setState(prev => ({ ...prev, error: 'Erreur de contrôle audio' }));
    }
  }, [state.isPlaying, musicEnabled]);

  // Arrêter complètement
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  // Contrôler le volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
      console.log(`🎵 Volume mis à jour: ${clampedVolume}`);
    }
  }, []);

  // Initialiser quand les détails du son changent
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  // Cleanup au démontage
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
    reinitialize: initializeAudio
  };
};
