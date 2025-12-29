import React from 'react';
import { ListChecks, MessageCircle } from 'lucide-react';
import type { CreationMode } from '@/types/chatbot';

interface CreationModeToggleProps {
  mode: CreationMode;
  onModeChange: (mode: CreationMode) => void;
}

const CreationModeToggle: React.FC<CreationModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center justify-center mb-6">
      <div className="inline-flex rounded-xl bg-muted/50 p-1 border border-border/50">
        <button
          type="button"
          onClick={() => onModeChange('guided')}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${mode === 'guided'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <ListChecks className="h-4 w-4" />
          <span>Mode guidé</span>
        </button>
        
        <button
          type="button"
          onClick={() => onModeChange('chat')}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${mode === 'chat'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <MessageCircle className="h-4 w-4" />
          <span>BETA - Discuter avec Calmi</span>
        </button>
      </div>
    </div>
  );
};

export default CreationModeToggle;
