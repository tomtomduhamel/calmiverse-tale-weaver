
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Volume2, VolumeX, Loader2, Settings, ChevronDown, Trash2, TestTube } from 'lucide-react';
import { useElevenLabsTTSNew } from '@/hooks/story/useElevenLabsTTSNew';
import { TextPreviewPanel } from './reader/TextPreviewPanel';
import { VoiceSelector } from './reader/VoiceSelector';
import { Progress } from '@/components/ui/progress';

interface ElevenLabsNewTTSProps {
  text: string;
  isDarkMode?: boolean;
  voiceId?: string;
  modelId?: string;
  className?: string;
}

export const ElevenLabsNewTTS: React.FC<ElevenLabsNewTTSProps> = ({ 
  text, 
  isDarkMode = false,
  voiceId: initialVoiceId,
  modelId,
  className = ""
}) => {
  const [selectedText, setSelectedText] = useState(text);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(initialVoiceId || '9BWtsMINqrJLrRacOk9x');
  
  const { 
    generateAndPlaySpeech, 
    stopAudio, 
    clearCache,
    testConnection,
    isLoading, 
    isPlaying,
    progress,
    generationProgress,
    cacheSize
  } = useElevenLabsTTSNew({ voiceId: selectedVoiceId, modelId });

  const handleClick = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      generateAndPlaySpeech(selectedText);
    }
  };

  const handleTestConnection = async () => {
    try {
      await testConnection();
    } catch (error) {
      console.error('Test connection failed:', error);
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (isLoading) return generationProgress || "Génération de l'audio...";
    return isPlaying ? "Arrêter la lecture" : "Lire avec ElevenLabs (Nouvelle version)";
  };

  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Bouton principal */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleClick}
          disabled={isLoading || !selectedText.trim()}
          className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
          title={getButtonTitle()}
        >
          {getButtonIcon()}
        </Button>
        
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Settings className="h-3 w-3 mr-1" />
              <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Barre de progression */}
      {(isLoading || isPlaying) && (
        <div className="space-y-1">
          <Progress value={isLoading ? undefined : progress} className="h-1" />
          {generationProgress && (
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {generationProgress}
            </div>
          )}
          {isPlaying && progress > 0 && (
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Lecture: {Math.round(progress)}%
            </div>
          )}
        </div>
      )}

      {/* Panneau avancé */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent>
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-4 space-y-4">
              {/* Test de connexion */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className={`${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  Tester la connexion
                </Button>
              </div>
              
              {/* Sélection de voix */}
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                onVoiceChange={setSelectedVoiceId}
                isDarkMode={isDarkMode}
              />
              
              {/* Sélection de texte */}
              <TextPreviewPanel
                fullText={text}
                onTextSelect={setSelectedText}
                isDarkMode={isDarkMode}
              />
              
              {/* Gestion du cache */}
              {cacheSize > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Cache: {cacheSize} audio{cacheSize > 1 ? 's' : ''} stocké{cacheSize > 1 ? 's' : ''}
                  </span>
                  <Button
                    onClick={clearCache}
                    size="sm"
                    variant="outline"
                    className={`h-6 px-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Vider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
