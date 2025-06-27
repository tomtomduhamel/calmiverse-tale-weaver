
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Loader2, AlertCircle, Settings } from 'lucide-react';
import { useElevenLabsTTSNew } from '@/hooks/story/useElevenLabsTTSNew';
import { VoiceSelector } from './VoiceSelector';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      try {
        await generateAndPlaySpeech(text);
      } catch (error) {
        console.error('TTS Error:', error);
        toast({
          title: "Erreur audio premium",
          description: "Impossible de générer l'audio. Utilisez l'audio système en dessous.",
          variant: "destructive"
        });
      }
    }
  };

  const handleTestConnection = async () => {
    try {
      await testConnection();
      toast({
        title: "Test réussi",
        description: "La connexion ElevenLabs fonctionne correctement",
      });
    } catch (error) {
      console.error('Test connection failed:', error);
      toast({
        title: "Test échoué",
        description: "Problème de connexion ElevenLabs. Vérifiez la configuration.",
        variant: "destructive"
      });
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

        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

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

      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleContent>
          <div className="p-3 border rounded bg-background space-y-3">
            <VoiceSelector
              selectedVoiceId={selectedVoiceId}
              onVoiceChange={setSelectedVoiceId}
              isDarkMode={isDarkMode}
            />
            
            <Button
              onClick={handleTestConnection}
              size="sm"
              variant="outline"
              className={`w-full ${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
            >
              Tester la connexion
            </Button>
            
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Texte: {text.length} caractères
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
