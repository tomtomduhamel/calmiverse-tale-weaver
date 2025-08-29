import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STORY_DURATION_OPTIONS, StoryDurationMinutes } from '@/types/story';
import MobileTitleSelector from './mobile/MobileTitleSelector';
import { useMediaQuery } from '@/hooks/use-media-query';

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

interface TitleSelectorProps {
  titles: GeneratedTitle[];
  onSelectTitle: (title: string, durationMinutes: StoryDurationMinutes) => void;
  onRegenerateTitles?: () => void;
  canRegenerate?: boolean;
  isCreatingStory: boolean;
  isRegenerating?: boolean;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({
  titles,
  onSelectTitle,
  onRegenerateTitles,
  canRegenerate = false,
  isCreatingStory,
  isRegenerating = false,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Rendu conditionnel pour mobile
  if (isMobile) {
    return (
      <MobileTitleSelector
        titles={titles}
        onSelectTitle={onSelectTitle}
        onRegenerateTitles={onRegenerateTitles}
        canRegenerate={canRegenerate}
        isCreatingStory={isCreatingStory}
        isRegenerating={isRegenerating}
      />
    );
  }
  if (titles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun titre disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-sm">
            {titles.length} titre{titles.length > 1 ? 's' : ''} généré{titles.length > 1 ? 's' : ''}
          </Badge>
          
          {canRegenerate && onRegenerateTitles && (
            <Button
              onClick={onRegenerateTitles}
              disabled={isRegenerating || isCreatingStory}
              variant="outline"
              size="sm"
              className="text-sm"
            >
              {isRegenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Génération...
                </>
              ) : (
                "Générer 3 autres titres"
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {titles.map((title, index) => (
            <Card 
              key={title.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isCreatingStory || isRegenerating ? 'opacity-50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {title.title}
                    </CardTitle>
                    {title.description && (
                      <CardDescription className="text-sm">
                        {title.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {STORY_DURATION_OPTIONS.map((duration) => (
                    <Button
                      key={duration}
                      onClick={() => onSelectTitle(title.title, duration)}
                      disabled={isCreatingStory || isRegenerating}
                      variant="secondary"
                      size="sm"
                    >
                      {isCreatingStory ? "Création..." : `${duration} min`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {titles.length < 3 && titles.length < 6 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Note: Seulement {titles.length} titre{titles.length > 1 ? 's ont' : ' a'} été généré{titles.length > 1 ? 's' : ''}.
          </p>
        )}
        
        {!canRegenerate && titles.length === 6 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            ✨ Vous avez maintenant 6 titres parmi lesquels choisir !
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleSelector;