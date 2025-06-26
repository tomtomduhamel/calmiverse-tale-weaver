
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { useElevenLabsTTSNew } from '@/hooks/story/useElevenLabsTTSNew';
import { VoiceSelector } from './VoiceSelector';
import { Badge } from '@/components/ui/badge';

interface SimpleTTSButtonProps {
  text: string;
  isDarkMode?: boolean;
  autoPlay?: boolean;
}

export const SimpleTTSButton: React.FC<SimpleTTSButtonProps> = ({
  text,
  isDarkMode = false,
  autoPlay = false
}) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState('9BWtsMINqrJLrRacOk9x');
  const [showSettings, setShowSettings] = useState(false);

  const {
    generateAndPlaySpeech,
    stopAudio,
    testConnection,
    isLoading,
    isPlaying,
    progress,
    generationProgress,
    cacheSize
  } = useElevenLabsTTSNew({
    voiceId: selectedVoiceId,
    modelId: 'eleven_multilingual_v2'
  });

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopAudio();
    } else {
      await generateAndPlaySpeech(text);
    }
  };

  const handleTestConnection = async () => {
    try {
      await testConnection();
    } catch (error) {
      console.error('Test connection failed:', error);
    }
  };

  if (!text || text.trim().length === 0) {
    return (
      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Aucun texte à lire
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePlayPause}
          disabled={isLoading}
          size="sm"
          className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Génération...' : isPlaying ? 'Pause' : 'Lire'}
        </Button>

        <Button
          onClick={() => setShowSettings(!showSettings)}
          size="sm"
          variant="outline"
          className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
        >
          <Volume2 className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleTestConnection}
          size="sm"
          variant="outline"
          className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
        >
          Test
        </Button>

        {cacheSize > 0 && (
          <Badge variant="secondary">
            Cache: {cacheSize}
          </Badge>
        )}
      </div>

      {generationProgress && (
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {generationProgress}
        </div>
      )}

      {isPlaying && progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {showSettings && (
        <div className="p-3 border rounded bg-background">
          <VoiceSelector
            selectedVoiceId={selectedVoiceId}
            onVoiceChange={setSelectedVoiceId}
            isDarkMode={isDarkMode}
          />
          
          <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Texte: {text.length} caractères
          </div>
        </div>
      )}
    </div>
  );
};
