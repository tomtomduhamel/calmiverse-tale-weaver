
import { useBackgroundSound } from '@/hooks/story/sound/useBackgroundSound';

interface SoundControlLogicProps {
  soundId?: string | null;
  storyObjective?: string | null;
  autoPlay?: boolean;
  children: (soundData: ReturnType<typeof useBackgroundSound>) => React.ReactNode;
}

export const SoundControlLogic: React.FC<SoundControlLogicProps> = ({
  soundId,
  storyObjective,
  autoPlay = false,
  children
}) => {
  const soundData = useBackgroundSound({ 
    soundId, 
    storyObjective,
    autoPlay 
  });

  console.log("🎵 SoundControlLogic robuste - rendu:", {
    soundId,
    storyObjective,
    isPlaying: soundData.isPlaying,
    isLoading: soundData.isLoading,
    soundDetails: soundData.soundDetails ? { id: soundData.soundDetails.id, title: soundData.soundDetails.title } : null,
    musicEnabled: soundData.musicEnabled,
    error: soundData.error,
    volume: soundData.volume,
    diagnosticInfo: soundData.diagnosticInfo
  });

  return <>{children(soundData)}</>;
};
