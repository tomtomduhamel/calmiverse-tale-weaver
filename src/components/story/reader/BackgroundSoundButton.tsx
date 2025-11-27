
import React from 'react';
import { SoundControlLogic } from './sound/SoundControlLogic';
import { SoundButtonStates } from './sound/SoundButtonStates';

interface BackgroundSoundButtonProps {
  soundId?: string | null;
  storyObjective?: string | null;
  isDarkMode?: boolean;
  autoPlay?: boolean;
  compact?: boolean;
}

export const BackgroundSoundButton: React.FC<BackgroundSoundButtonProps> = ({
  soundId,
  storyObjective,
  isDarkMode = false,
  autoPlay = false,
  compact = false
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
            soundData.setVolume(0.5); // Rétablir à un volume par défaut
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
            diagnosticInfo={soundData.diagnosticInfo}
            onVolumeToggle={toggleVolume}
            onPlayToggle={soundData.togglePlay}
            onReinitialize={soundData.reinitialize}
          />
        );
      }}
    </SoundControlLogic>
  );
};

export default BackgroundSoundButton;
