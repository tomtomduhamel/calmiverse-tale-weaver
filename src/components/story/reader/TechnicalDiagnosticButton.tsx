
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Network, Volume2 } from 'lucide-react';
import { ConnectivityDiagnostic } from './ConnectivityDiagnostic';
import { EdgeFunctionLogger } from './EdgeFunctionLogger';

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
          <Settings className="h-4 w-4 mr-2" />
          Diagnostic Technique
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-auto ${isDarkMode ? 'bg-gray-800 text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Diagnostic Technique - TTS & Connectivité
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="connectivity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connectivity" className="flex items-center gap-1">
              <Network className="h-4 w-4" />
              Connectivité
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              Audio TTS
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connectivity" className="mt-4">
            <ConnectivityDiagnostic isDarkMode={isDarkMode} />
          </TabsContent>
          
          <TabsContent value="audio" className="mt-4">
            <EdgeFunctionLogger isDarkMode={isDarkMode} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
