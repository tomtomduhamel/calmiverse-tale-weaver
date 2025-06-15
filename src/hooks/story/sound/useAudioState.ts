
import { useState, useRef, useCallback } from 'react';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  error: string | null;
  currentSoundId: string | null;
}

export const useAudioState = () => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isLoading: true, // Corrigé: Initialiser à true pour refléter le chargement en cours
    volume: 0.5,
    error: null,
    currentSoundId: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  const updateState = useCallback((updates: Partial<AudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []); // Stabilisé avec useCallback

  return {
    state,
    updateState,
    audioRef,
    isInitializedRef
  };
};
