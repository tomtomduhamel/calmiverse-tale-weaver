
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSoundDetails } from './useSoundDetails';
import { useSoundPlayer } from './useSoundPlayer';

interface BackgroundSoundProps {
  soundId?: string | null;
  storyObjective?: string | null;
  autoPlay?: boolean;
}

/**
 * Hook principal pour gérer le fond sonore d'une histoire
 */
export const useBackgroundSound = ({ 
  soundId, 
  storyObjective,
  autoPlay = false 
}: BackgroundSoundProps) => {
  // Vérifier si la musique est activée dans les préférences
  const { userSettings } = useUserSettings();
  const musicEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled ?? true;

  // Utiliser le hook spécialisé pour charger les détails du son
  const { soundDetails, isLoading, error: detailsError } = useSoundDetails(soundId, storyObjective);
  
  // Utiliser le hook spécialisé pour la lecture du son
  const { 
    isPlaying, 
    togglePlay, 
    setVolume, 
    stopSound, 
    volume,
    error: playerError 
  } = useSoundPlayer({
    soundDetails,
    autoPlay,
    musicEnabled
  });

  // Combiner les erreurs potentielles
  const error = detailsError || playerError;

  // Log pour débogage
  console.log("🎵 useBackgroundSound - État:", {
    soundId,
    storyObjective,
    isPlaying,
    isLoading,
    soundDetails: soundDetails ? { title: soundDetails.title, objective: soundDetails.objective } : null,
    musicEnabled,
    volume,
    error
  });

  return {
    isPlaying,
    isLoading,
    soundDetails,
    togglePlay,
    setVolume,
    stopSound,
    musicEnabled,
    volume,
    error
  };
};

export default useBackgroundSound;
