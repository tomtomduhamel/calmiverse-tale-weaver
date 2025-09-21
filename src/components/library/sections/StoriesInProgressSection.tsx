import React from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStoryBackgroundOperations } from '@/hooks/stories/useStoryBackgroundOperations';

interface StoriesInProgressSectionProps {
  className?: string;
}

/**
 * Section affichant les histoires en cours de génération
 * Nouvelle section pour la Phase 5
 */
export const StoriesInProgressSection: React.FC<StoriesInProgressSectionProps> = ({ 
  className 
}) => {
  const { getStoriesInProgress, getInProgressCount } = useStoryBackgroundOperations();
  
  const storiesInProgress = getStoriesInProgress();
  const inProgressCount = getInProgressCount();

  if (inProgressCount === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Histoires en cours
            <Badge variant="secondary" className="ml-auto">
              {inProgressCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {storiesInProgress.map((story) => (
            <div 
              key={story.id}
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">
                    Histoire pour {story.childrenIds?.length === 1 ? '1 enfant' : `${story.childrenIds?.length} enfants`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Objectif: {story.objective}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={story.status === 'processing' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {story.status === 'processing' ? 'En génération' : 'En attente'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(story.createdAt).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Vous serez notifié quand les histoires seront prêtes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};