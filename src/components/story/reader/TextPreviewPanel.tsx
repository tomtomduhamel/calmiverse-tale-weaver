
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Scissors, Volume2 } from "lucide-react";

interface TextSegment {
  text: string;
  length: number;
  isSelected: boolean;
}

interface TextPreviewPanelProps {
  fullText: string;
  onTextSelect: (selectedText: string) => void;
  isDarkMode?: boolean;
  maxSegmentLength?: number;
}

export const TextPreviewPanel: React.FC<TextPreviewPanelProps> = ({
  fullText,
  onTextSelect,
  isDarkMode = false,
  maxSegmentLength = 2500
}) => {
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);

  // Segmentation intelligente par phrases
  const segments = useMemo((): TextSegment[] => {
    if (!fullText || fullText.trim().length === 0) return [];

    if (fullText.length <= maxSegmentLength) {
      return [{
        text: fullText,
        length: fullText.length,
        isSelected: true
      }];
    }

    // Découper par phrases
    const sentences = fullText.match(/[^\.!?]+[\.!?]+/g) || [fullText];
    const result: TextSegment[] = [];
    let currentSegment = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentSegment.length + trimmedSentence.length > maxSegmentLength && currentSegment.length > 0) {
        result.push({
          text: currentSegment.trim(),
          length: currentSegment.trim().length,
          isSelected: result.length === selectedSegmentIndex
        });
        currentSegment = trimmedSentence;
      } else {
        currentSegment += (currentSegment.length > 0 ? ' ' : '') + trimmedSentence;
      }
    }
    
    if (currentSegment.trim().length > 0) {
      result.push({
        text: currentSegment.trim(),
        length: currentSegment.trim().length,
        isSelected: result.length === selectedSegmentIndex
      });
    }

    return result;
  }, [fullText, maxSegmentLength, selectedSegmentIndex]);

  const selectedText = useCustomText ? customText : segments[selectedSegmentIndex]?.text || '';

  const handleSegmentSelect = (index: number) => {
    setSelectedSegmentIndex(index);
    setUseCustomText(false);
    onTextSelect(segments[index]?.text || '');
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    setUseCustomText(true);
    onTextSelect(text);
  };

  const getCharacterCountColor = (length: number) => {
    if (length <= 1000) return 'text-green-600';
    if (length <= 2000) return 'text-yellow-600';
    if (length <= 2500) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <FileText className="h-4 w-4" />
          Prévisualisation du texte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Texte complet</div>
            <div className={`font-mono ${getCharacterCountColor(fullText.length)}`}>
              {fullText.length} caractères
            </div>
          </div>
          <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Sélectionné</div>
            <div className={`font-mono ${getCharacterCountColor(selectedText.length)}`}>
              {selectedText.length} caractères
            </div>
          </div>
        </div>

        {/* Segments automatiques */}
        {segments.length > 1 && (
          <div className="space-y-2">
            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Scissors className="h-3 w-3 inline mr-1" />
              Segments disponibles ({segments.length})
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {segments.map((segment, index) => (
                <button
                  key={index}
                  onClick={() => handleSegmentSelect(index)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    selectedSegmentIndex === index && !useCustomText
                      ? isDarkMode 
                        ? 'bg-blue-900 border border-blue-700' 
                        : 'bg-blue-50 border border-blue-200'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Segment {index + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {segment.length} car.
                    </Badge>
                  </div>
                  <div className={`truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {segment.text.substring(0, 80)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Texte personnalisé */}
        <div className="space-y-2">
          <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Ou saisissez votre propre texte
          </div>
          <Textarea
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            placeholder="Tapez ou collez le texte à lire..."
            className={`text-xs h-20 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            maxLength={2500}
          />
          {customText.length > 0 && (
            <div className={`text-xs ${getCharacterCountColor(customText.length)}`}>
              {customText.length}/2500 caractères
            </div>
          )}
        </div>

        {/* Aperçu du texte sélectionné */}
        <div className="space-y-2">
          <div className={`text-xs font-medium flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Volume2 className="h-3 w-3" />
            Texte qui sera lu
          </div>
          <div className={`p-3 rounded border text-xs max-h-32 overflow-y-auto ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-300' 
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            {selectedText || "Aucun texte sélectionné"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
