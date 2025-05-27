
import { useState, useEffect, useRef, useCallback } from 'react';

interface SoundDetails {
  id: string;
  title: string;
  file_url: string;
  objective?: string;
}

interface SoundPlayerProps {
  soundDetails: SoundDetails | null;
  autoPlay?: boolean;
  musicEnabled?: boolean;
}

/**
 * Hook pour gérer la lecture d'un son avec contrôle du volume
 */
export const useSoundPlayer = ({ 
  soundDetails, 
  autoPlay = false, 
  musicEnabled = true 
}: SoundPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Créer l'élément audio quand les détails du son sont disponibles
  useEffect(() => {
    if (!soundDetails || !musicEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    try {
      // Nettoyer l'ancien audio s'il existe
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Créer un nouvel élément audio
      const audio = new Audio(soundDetails.file_url);
      audio.loop = true;
      audio.volume = volume;
      
      audio.addEventListener('loadstart', () => {
        console.log(`🎵 Chargement du son: ${soundDetails.title}`);
        setError(null);
      });

      audio.addEventListener('canplay', () => {
        console.log(`🎵 Son prêt à jouer: ${soundDetails.title}`);
        if (autoPlay) {
          audio.play().catch(err => {
            console.error('🎵 Erreur auto-play:', err);
            setError('Impossible de démarrer la lecture automatique');
          });
        }
      });

      audio.addEventListener('play', () => {
        console.log(`🎵 Lecture démarrée: ${soundDetails.title}`);
        setIsPlaying(true);
      });

      audio.addEventListener('pause', () => {
        console.log(`🎵 Lecture mise en pause: ${soundDetails.title}`);
        setIsPlaying(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('🎵 Erreur audio:', e);
        setError('Erreur lors du chargement du son');
        setIsPlaying(false);
      });

      audioRef.current = audio;

    } catch (err) {
      console.error('🎵 Erreur lors de la création de l\'audio:', err);
      setError('Impossible de créer le lecteur audio');
    }

    // Cleanup lors du démontage
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [soundDetails, musicEnabled, autoPlay]);

  // Mettre à jour le volume de l'audio quand le volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      console.log(`🎵 Volume mis à jour: ${volume}`);
    }
  }, [volume]);

  // Fonction pour démarrer/arrêter la lecture
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !musicEnabled) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('🎵 Erreur lors de la lecture:', err);
          setError('Impossible de démarrer la lecture');
        });
      }
    } catch (err) {
      console.error('🎵 Erreur togglePlay:', err);
      setError('Erreur lors du contrôle de la lecture');
    }
  }, [isPlaying, musicEnabled]);

  // Fonction pour arrêter complètement le son
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // Fonction pour définir le volume
  const setVolumeControl = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  }, []);

  return {
    isPlaying,
    togglePlay,
    setVolume: setVolumeControl,
    stopSound,
    volume,
    error
  };
};
