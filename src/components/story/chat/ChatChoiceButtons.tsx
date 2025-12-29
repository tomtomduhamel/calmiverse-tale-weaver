import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Moon, Brain, Heart, Sparkles, Star, Wand2, TreePine, Castle, Ship, Rocket, User } from 'lucide-react';
import type { ChatbotChoice } from '@/types/chatbot';
import { cn } from '@/lib/utils';

// Map des icônes disponibles
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Moon,
  Brain,
  Heart,
  Sparkles,
  Star,
  Wand2,
  TreePine,
  Castle,
  Ship,
  Rocket,
  User,
};

interface ChatChoiceButtonsProps {
  choices: ChatbotChoice[];
  choiceType: 'single' | 'multiple';
  selectedChoices: string[];
  confirmed: boolean;
  onSelect: (choiceId: string) => void;
  onConfirm: () => void;
  disabled?: boolean;
}

const ChatChoiceButtons: React.FC<ChatChoiceButtonsProps> = ({
  choices,
  choiceType,
  selectedChoices,
  confirmed,
  onSelect,
  onConfirm,
  disabled = false,
}) => {
  const hasSelection = selectedChoices.length > 0;
  const isDisabled = disabled || confirmed;

  // Calcul du nombre de colonnes selon le nombre de choix
  const getGridCols = () => {
    if (choices.length <= 2) return 'grid-cols-2';
    if (choices.length <= 4) return 'grid-cols-2 sm:grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-3';
  };

  return (
    <div className="space-y-3">
      {/* Label du type de sélection */}
      <p className="text-xs text-muted-foreground">
        {choiceType === 'multiple' 
          ? 'Sélectionnez un ou plusieurs choix :'
          : 'Choisissez une option :'
        }
      </p>

      {/* Grille de boutons */}
      <div className={cn('grid gap-2', getGridCols())}>
        {choices.map((choice) => {
          const isSelected = selectedChoices.includes(choice.id);
          const IconComponent = choice.icon ? iconMap[choice.icon] : null;

          return (
            <button
              key={choice.id}
              onClick={() => !isDisabled && onSelect(choice.id)}
              disabled={isDisabled}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                'border-2 text-left',
                // État par défaut
                !isSelected && !isDisabled && 'bg-muted/30 border-border/50 hover:bg-primary/10 hover:border-primary/30',
                // État sélectionné
                isSelected && !confirmed && 'bg-primary/15 border-primary text-primary ring-2 ring-primary/20',
                // État confirmé
                confirmed && isSelected && 'bg-primary/20 border-primary/50 text-primary',
                confirmed && !isSelected && 'bg-muted/20 border-border/30 text-muted-foreground opacity-50',
                // Désactivé
                isDisabled && 'cursor-not-allowed'
              )}
            >
              {/* Icône optionnelle */}
              {IconComponent && (
                <IconComponent className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
              )}
              
              {/* Label */}
              <span className="flex-1 truncate">{choice.label}</span>
              
              {/* Check si sélectionné */}
              {isSelected && (
                <Check className="h-4 w-4 flex-shrink-0 text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bouton de confirmation */}
      {hasSelection && !confirmed && (
        <Button
          onClick={onConfirm}
          disabled={isDisabled}
          className="w-full mt-2 gap-2"
          size="sm"
        >
          <Check className="h-4 w-4" />
          {choiceType === 'multiple' 
            ? `Confirmer ma sélection (${selectedChoices.length})`
            : 'Confirmer mon choix'
          }
        </Button>
      )}

      {/* Message après confirmation */}
      {confirmed && (
        <p className="text-xs text-muted-foreground italic">
          ✓ Choix confirmé
        </p>
      )}
    </div>
  );
};

export default ChatChoiceButtons;
