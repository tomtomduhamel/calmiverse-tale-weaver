
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Volume2, VolumeX, Loader2, Settings, ChevronDown, Trash2 } from 'lucide-react';
import { useElevenLabsTTS } from '@/hooks/story/useElevenLabsTTS';
import { ElevenLabsDiagnosticPanel } from './reader/ElevenLabsDiagnosticPanel';
import { TextPreviewPanel } from './reader/TextPreviewPanel';
import { Progress } from '@/components/ui/progress';

interface ElevenLabsTextToSpeechProps {
  text: string;
  isDarkMode?: boolean;
  voiceId?: string;
  modelId?: string;
  className?: string;
}

export const ElevenLabsTextToSpeech: React.FC<ElevenLabsTextToSpeechProps> = ({ 
  text, 
  isDarkMode = false,
  voiceId,
  modelId,
  className = ""
}) => {
  const [selectedText, setSelectedText] = useState(text);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { 
    generateAndPlaySpeech, 
    stopAudio, 
    clearCache,
    isLoading, 
    isPlaying,
    progress,
    generationProgress,
    cacheSize
  } = useElevenLabsTTS({ voiceId, modelId });

  const handleClick = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      generateAndPlaySpeech(selectedText);
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
    return isPlaying ? "Arrêter la lecture" : "Lire avec ElevenLabs";
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
              {/* Sélection de texte */}
              <TextPreviewPanel
                fullText={text}
                onTextSelect={setSelectedText}
                isDarkMode={isDarkMode}
              />
              
              {/* Diagnostic */}
              <ElevenLabsDiagnosticPanel isDarkMode={isDarkMode} />
              
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
