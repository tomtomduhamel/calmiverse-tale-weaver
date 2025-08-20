import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, BookOpen } from 'lucide-react';
import { useStorySeries } from '@/hooks/stories/useStorySeries';
import type { Story, SequelData } from '@/types/story';

interface CreateSequelButtonProps {
  story: Story;
  onSequelCreated?: (storyId: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export const CreateSequelButton: React.FC<CreateSequelButtonProps> = ({
  story,
  onSequelCreated,
  disabled = false,
  variant = 'outline',
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState(story.series?.title || `Les aventures de ${story.childrenNames?.[0] || 'nos héros'}`);
  const [sequelInstructions, setSequelInstructions] = useState({
    maintainCharacterConsistency: true,
    referenceToEvents: true,
    evolutionOfCharacters: true,
    newChallengesIntroduced: true
  });

  const { createSequel, isCreating } = useStorySeries();

  // Ne pas afficher le bouton si l'histoire n'est pas terminée ou en erreur
  const canCreateSequel = story.status === 'ready' || story.status === 'read';
  
  if (!canCreateSequel) return null;

  const handleCreateSequel = async () => {
    const sequelData: SequelData = {
      previousStoryId: story.id,
      childrenIds: story.childrenIds,
      childrenNames: story.childrenNames || [],
      objective: typeof story.objective === 'string' ? story.objective : story.objective?.value || '',
      seriesTitle: !story.series_id ? seriesTitle : undefined,
      sequelInstructions
    };

    const newStoryId = await createSequel(sequelData);
    
    if (newStoryId) {
      setIsOpen(false);
      onSequelCreated?.(newStoryId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Créer une suite
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Créer une suite à "{story.title}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!story.series_id && (
            <div>
              <Label htmlFor="series-title">Titre de la série</Label>
              <Input
                id="series-title"
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="Nom de votre série d'histoires"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Instructions pour la suite</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="consistency" className="text-sm">Maintenir la cohérence des personnages</Label>
                <Switch
                  id="consistency"
                  checked={sequelInstructions.maintainCharacterConsistency}
                  onCheckedChange={(checked) => 
                    setSequelInstructions(prev => ({ ...prev, maintainCharacterConsistency: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="references" className="text-sm">Faire référence aux événements précédents</Label>
                <Switch
                  id="references"
                  checked={sequelInstructions.referenceToEvents}
                  onCheckedChange={(checked) => 
                    setSequelInstructions(prev => ({ ...prev, referenceToEvents: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="evolution" className="text-sm">Évolution des personnages</Label>
                <Switch
                  id="evolution"
                  checked={sequelInstructions.evolutionOfCharacters}
                  onCheckedChange={(checked) => 
                    setSequelInstructions(prev => ({ ...prev, evolutionOfCharacters: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="challenges" className="text-sm">Nouveaux défis à relever</Label>
                <Switch
                  id="challenges"
                  checked={sequelInstructions.newChallengesIntroduced}
                  onCheckedChange={(checked) => 
                    setSequelInstructions(prev => ({ ...prev, newChallengesIntroduced: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateSequel}
              disabled={isCreating || !seriesTitle.trim()}
              className="flex-1"
            >
              {isCreating ? 'Création...' : 'Créer la suite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};