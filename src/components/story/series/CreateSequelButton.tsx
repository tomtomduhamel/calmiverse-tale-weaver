import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, BookOpen, Clock } from 'lucide-react';
import { useStorySeries } from '@/hooks/stories/useStorySeries';
import { SequelCreationProgress } from './SequelCreationProgress';
import type { Story, SequelData, StoryDurationMinutes } from '@/types/story';
import { STORY_DURATION_OPTIONS } from '@/types/story';
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
  const [duration, setDuration] = useState<StoryDurationMinutes>(10);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);
  const [sequelInstructions, setSequelInstructions] = useState({
    maintainCharacterConsistency: true,
    referenceToEvents: true,
    evolutionOfCharacters: true,
    newChallengesIntroduced: true
  });
  const {
    createSequel,
    isCreating
  } = useStorySeries();

  // Ne pas afficher le bouton si l'histoire n'est pas terminée ou en erreur
  const canCreateSequel = story.status === 'ready' || story.status === 'read';
  if (!canCreateSequel) return null;
  const handleCreateSequel = async () => {
    const sequelData: SequelData = {
      previousStoryId: story.id,
      childrenIds: story.childrenIds,
      childrenNames: story.childrenNames || [],
      objective: typeof story.objective === 'string' ? story.objective : story.objective?.value || '',
      duration,
      seriesTitle: !story.series_id ? seriesTitle : undefined,
      sequelInstructions
    };
    
    const newStoryId = await createSequel(sequelData);
    if (newStoryId) {
      setCreatedStoryId(newStoryId);
      onSequelCreated?.(newStoryId);
    }
  };

  const handleProgressComplete = () => {
    setCreatedStoryId(null);
    setIsOpen(false);
  };

  const handleProgressError = (error: string) => {
    console.error('[CreateSequelButton] Erreur génération:', error);
    setCreatedStoryId(null);
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled} className="gap-2">
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
          {createdStoryId ? (
            <SequelCreationProgress 
              storyId={createdStoryId} 
              onComplete={handleProgressComplete}
              onError={handleProgressError}
            />
          ) : (
            <>
              <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Durée de l'histoire
            </Label>
            <RadioGroup value={duration.toString()} onValueChange={value => setDuration(parseInt(value) as StoryDurationMinutes)} className="flex gap-4 mt-2">
              {STORY_DURATION_OPTIONS.map(durationOption => <div key={durationOption} className="flex items-center space-x-2">
                  <RadioGroupItem value={durationOption.toString()} id={`duration-${durationOption}`} />
                  <Label htmlFor={`duration-${durationOption}`} className="text-sm">
                    {durationOption} min
                  </Label>
                </div>)}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">Instructions pour la suite</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="consistency" className="text-sm">Maintenir la cohérence des personnages</Label>
                <Switch id="consistency" checked={sequelInstructions.maintainCharacterConsistency} onCheckedChange={checked => setSequelInstructions(prev => ({
                ...prev,
                maintainCharacterConsistency: checked
              }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="references" className="text-sm">Faire référence aux événements précédents</Label>
                <Switch id="references" checked={sequelInstructions.referenceToEvents} onCheckedChange={checked => setSequelInstructions(prev => ({
                ...prev,
                referenceToEvents: checked
              }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="evolution" className="text-sm">Évolution des personnages</Label>
                <Switch id="evolution" checked={sequelInstructions.evolutionOfCharacters} onCheckedChange={checked => setSequelInstructions(prev => ({
                ...prev,
                evolutionOfCharacters: checked
              }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="challenges" className="text-sm">Nouveaux défis à relever</Label>
                <Switch id="challenges" checked={sequelInstructions.newChallengesIntroduced} onCheckedChange={checked => setSequelInstructions(prev => ({
                ...prev,
                newChallengesIntroduced: checked
              }))} />
              </div>
            </div>
          </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleCreateSequel} disabled={isCreating} className="flex-1">
                  {isCreating ? 'Création...' : 'Créer la suite'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>;
};