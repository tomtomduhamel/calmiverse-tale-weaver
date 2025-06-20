
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Voice {
  id: string;
  name: string;
}

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  isDarkMode?: boolean;
}

// Voix ElevenLabs populaires avec leurs IDs
const ELEVENLABS_VOICES: Voice[] = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (Féminine)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Féminine)' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Féminine)' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte (Féminine)' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice (Féminine)' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica (Féminine)' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Féminine)' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Masculine)' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Masculine)' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Masculine)' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (Masculine)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Masculine)' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Will (Masculine)' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric (Masculine)' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris (Masculine)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Masculine)' },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onVoiceChange,
  isDarkMode = false
}) => {
  return (
    <div className="space-y-2">
      <Label className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
        Voix de lecture
      </Label>
      <Select value={selectedVoiceId} onValueChange={onVoiceChange}>
        <SelectTrigger className={`w-full ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}`}>
          <SelectValue placeholder="Choisir une voix" />
        </SelectTrigger>
        <SelectContent className={isDarkMode ? 'bg-gray-800 border-gray-600' : ''}>
          {ELEVENLABS_VOICES.map((voice) => (
            <SelectItem 
              key={voice.id} 
              value={voice.id}
              className={isDarkMode ? 'text-white hover:bg-gray-700' : ''}
            >
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
