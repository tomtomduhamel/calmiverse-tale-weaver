
import { useState, useRef } from 'react';

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
    isLoading: false,
    volume: 0.5,
    error: null,
    currentSoundId: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  const updateState = (updates: Partial<AudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return {
    state,
    updateState,
    audioRef,
    isInitializedRef
  };
};
