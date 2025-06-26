
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bug } from 'lucide-react';
import { AdvancedElevenLabsDiagnostic } from './AdvancedElevenLabsDiagnostic';

interface TechnicalDiagnosticButtonProps {
  isDarkMode?: boolean;
}

export const TechnicalDiagnosticButton: React.FC<TechnicalDiagnosticButtonProps> = ({
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
        >
          <Bug className="h-3 w-3 mr-1" />
          Diagnostic TTS
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            Diagnostic Technique ElevenLabs TTS
          </DialogTitle>
          <DialogDescription className={isDarkMode ? 'text-gray-300' : ''}>
            Analyse complète du système de synthèse vocale ElevenLabs
          </DialogDescription>
        </DialogHeader>
        <AdvancedElevenLabsDiagnostic isDarkMode={isDarkMode} />
      </DialogContent>
    </Dialog>
  );
};
