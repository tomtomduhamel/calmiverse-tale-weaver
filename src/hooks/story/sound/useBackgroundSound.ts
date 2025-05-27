
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSoundDetails } from './useSoundDetails';
import { useAudioPlayer } from './useAudioPlayer';

interface BackgroundSoundProps {
  soundId?: string | null;
  storyObjective?: string | null;
  autoPlay?: boolean;
}

/**
 * Hook principal pour gérer le fond sonore d'une histoire - Version refactorisée
 */
export const useBackgroundSound = ({ 
  soundId, 
  storyObjective,
  autoPlay = false 
}: BackgroundSoundProps) => {
  // Vérifier si la musique est activée dans les préférences
  const { userSettings } = useUserSettings();
  const musicEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled ?? true;

  // Charger les détails du son
  const { soundDetails, isLoading: isLoadingDetails, error: detailsError } = useSoundDetails(soundId, storyObjective);
  
  // Gérer la lecture audio avec le nouveau player centralisé
  const { 
    isPlaying, 
    isLoading: isLoadingAudio,
    volume,
    error: audioError,
    togglePlay, 
    setVolume, 
    stopAudio,
    reinitialize
  } = useAudioPlayer({
    soundDetails,
    musicEnabled,
    autoPlay
  });

  // Combiner les états de chargement et les erreurs
  const isLoading = isLoadingDetails || isLoadingAudio;
  const error = detailsError || audioError;

  // Log pour débogage complet
  console.log("🎵 useBackgroundSound - État complet:", {
    soundId,
    storyObjective,
    autoPlay,
    musicEnabled,
    soundDetails: soundDetails ? { 
      id: soundDetails.id, 
      title: soundDetails.title, 
      file_path: soundDetails.file_path,
      objective: soundDetails.objective 
    } : null,
    isLoading,
    isPlaying,
    volume,
    error
  });

  return {
    isPlaying,
    isLoading,
    soundDetails,
    togglePlay,
    setVolume,
    stopSound: stopAudio,
    musicEnabled,
    volume,
    error,
    reinitialize // Fonction pour relancer l'initialisation si nécessaire
  };
};

export default useBackgroundSound;
