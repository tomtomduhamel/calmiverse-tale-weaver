
import { useAudioControls } from './useAudioControls';
import { useAudioInitialization } from './useAudioInitialization';

interface AudioPlayerProps {
  soundDetails: any | null;
  musicEnabled: boolean;
  autoPlay?: boolean;
}

export const useAudioPlayer = ({ soundDetails, musicEnabled, autoPlay = false }: AudioPlayerProps) => {
  const { 
    state, 
    updateState, 
    audioRef, 
    isInitializedRef, // Corrigé: Récupération de la ref partagée
    togglePlay, 
    stopAudio, 
    setVolume 
  } = useAudioControls({ musicEnabled });
  
  const { initializeAudio } = useAudioInitialization({
    soundDetails,
    musicEnabled,
    autoPlay,
    audioRef,
    isInitializedRef, // Corrigé: Utilisation de la ref partagée
    state,
    updateState
  });

  return {
    ...state,
    togglePlay,
    stopAudio,
    setVolume,
    reinitialize: initializeAudio
  };
};
