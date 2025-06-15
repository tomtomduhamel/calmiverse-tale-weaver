
import { useCallback } from 'react';
import { useAudioState } from './useAudioState';

interface UseAudioControlsProps {
  musicEnabled: boolean;
}

export const useAudioControls = ({ musicEnabled }: UseAudioControlsProps) => {
  const { state, updateState, audioRef, isInitializedRef } = useAudioState();

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
          updateState({ error: 'Erreur lors de la lecture' });
        });
      }
    } catch (error) {
      console.error('🎵 Erreur togglePlay:', error);
      updateState({ error: 'Erreur de contrôle audio' });
    }
  }, [state.isPlaying, musicEnabled, updateState]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      updateState({ isPlaying: false });
    }
  }, [updateState]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    updateState({ volume: clampedVolume });
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
      console.log(`🎵 Volume mis à jour: ${clampedVolume}`);
    }
  }, [updateState]);

  return {
    state,
    updateState,
    audioRef,
    isInitializedRef, // Corrigé: propage isInitializedRef
    togglePlay,
    stopAudio,
    setVolume
  };
};
