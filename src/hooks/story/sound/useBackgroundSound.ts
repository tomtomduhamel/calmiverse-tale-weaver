
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSoundDetails } from './useSoundDetails';
import { useRobustAudioPlayer } from './useRobustAudioPlayer';

interface BackgroundSoundProps {
  soundId?: string | null;
  storyObjective?: string | null;
  autoPlay?: boolean;
}

/**
 * Hook principal pour gérer le fond sonore d'une histoire - Version robuste
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
  
  // Gérer la lecture audio avec le nouveau player robuste
  const { 
    isPlaying, 
    isLoading: isLoadingAudio,
    volume,
    error: audioError,
    diagnosticInfo,
    togglePlay, 
    setVolume, 
    stopAudio,
    reinitialize
  } = useRobustAudioPlayer({
    soundDetails,
    musicEnabled,
    autoPlay
  });

  // Combiner les états de chargement et les erreurs
  const isLoading = isLoadingDetails || isLoadingAudio;
  const error = detailsError || audioError;

  // Log pour débogage complet avec diagnostic
  console.log("🎵 useBackgroundSound - État robuste:", {
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
    error,
    diagnostic: diagnosticInfo
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
    reinitialize,
    diagnosticInfo // Information de diagnostic pour debugging avancé
  };
};

export default useBackgroundSound;
