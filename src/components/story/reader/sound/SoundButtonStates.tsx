
import React from 'react';
import { LoadingState } from './states/LoadingState';
import { ErrorState } from './states/ErrorState';
import { NoSoundState } from './states/NoSoundState';
import { AudioControlsState } from './states/AudioControlsState';

interface SoundButtonStatesProps {
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  soundDetails: any;
  storyObjective?: string | null;
  volume: number;
  isPlaying: boolean;
  diagnosticInfo?: any;
  onVolumeToggle: () => void;
  onPlayToggle: () => void;
  onReinitialize: () => void;
}

export const SoundButtonStates: React.FC<SoundButtonStatesProps> = ({
  isDarkMode,
  isLoading,
  error,
  soundDetails,
  storyObjective,
  volume,
  isPlaying,
  onVolumeToggle,
  onPlayToggle,
  onReinitialize
}) => {
  if (error) {
    return (
      <ErrorState 
        isDarkMode={isDarkMode} 
        error={error} 
        onReinitialize={onReinitialize} 
      />
    );
  }

  if (isLoading) {
    return <LoadingState isDarkMode={isDarkMode} />;
  }

  if (!soundDetails) {
    return <NoSoundState isDarkMode={isDarkMode} storyObjective={storyObjective} />;
  }

  return (
    <AudioControlsState 
      isDarkMode={isDarkMode}
      isPlaying={isPlaying}
      volume={volume}
      soundDetails={soundDetails}
      onPlayToggle={onPlayToggle}
      onVolumeToggle={onVolumeToggle}
    />
  );
};
