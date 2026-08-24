import React from 'react';
import { ListChecks, MessageCircle, Zap } from 'lucide-react';
import type { CreationMode } from '@/types/chatbot';
import { useIsSuperAdmin } from '@/hooks/auth/useIsSuperAdmin';

interface CreationModeToggleProps {
  mode: CreationMode;
  onModeChange: (mode: CreationMode) => void;
}

const CreationModeToggle: React.FC<CreationModeToggleProps> = ({ mode, onModeChange }) => {
  const { isSuperAdmin } = useIsSuperAdmin();

  return (
    <div className="flex items-center justify-center mb-3 sm:mb-5">
      <div className="inline-flex rounded-xl bg-card/60 backdrop-blur-md p-1 border border-primary-soft/30 max-w-md w-full justify-center">
        <button
          type="button"
          onClick={() => onModeChange('guided')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
            transition-all duration-200
            ${mode === 'guided'
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Mode guidé</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('fast')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
            transition-all duration-200
            ${mode === 'fast'
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Rapide</span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => onModeChange('chat')}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
              transition-all duration-200
              ${mode === 'chat'
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Discussion IA</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CreationModeToggle;

