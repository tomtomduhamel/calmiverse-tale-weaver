
import React from 'react';
import { SoundControlLogic } from './sound/SoundControlLogic';
import { SoundButtonStates } from './sound/SoundButtonStates';

interface BackgroundSoundButtonProps {
  soundId?: string | null;
  storyObjective?: string | null;
  isDarkMode?: boolean;
  autoPlay?: boolean;
}

export const BackgroundSoundButton: React.FC<BackgroundSoundButtonProps> = ({
  soundId,
  storyObjective,
  isDarkMode = false,
  autoPlay = false
}) => {
  return (
    <SoundControlLogic
      soundId={soundId}
      storyObjective={storyObjective}
      autoPlay={autoPlay}
    >
      {(soundData) => {
        // Si la musique est désactivée, ne rien afficher
        if (!soundData.musicEnabled) {
          console.log("🎵 Musique désactivée dans les préférences");
          return null;
        }

        // Fonction pour basculer entre muet et volume normal
        const toggleVolume = () => {
          if (soundData.volume > 0) {
            soundData.setVolume(0);
          } else {
            soundData.setVolume(0.5);
          }
        };

        return (
          <SoundButtonStates
            isDarkMode={isDarkMode}
            isLoading={soundData.isLoading}
            error={soundData.error}
            soundDetails={soundData.soundDetails}
            storyObjective={storyObjective}
            volume={soundData.volume}
            isPlaying={soundData.isPlaying}
            onVolumeToggle={toggleVolume}
            onReinitialize={soundData.reinitialize}
          />
        );
      }}
    </SoundControlLogic>
  );
};

export default BackgroundSoundButton;
