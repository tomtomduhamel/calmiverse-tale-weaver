import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, Eye } from 'lucide-react';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Indicateur discret des histoires en cours de génération
 * Affiché de manière non-intrusive sur l'interface
 */
const PendingStoriesIndicator: React.FC = () => {
  const { activeGenerations, totalActiveCount } = useBackgroundStoryGeneration();
  const navigate = useNavigate();

  if (totalActiveCount === 0) {
    return null;
  }

  const handleViewAll = () => {
    navigate('/library?filter=pending');
  };

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {totalActiveCount} histoire{totalActiveCount > 1 ? 's' : ''} en cours
              </span>
            </div>
          </div>
          
          {totalActiveCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAll}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Voir tout
            </Button>
          )}
        </div>

        {/* Affichage des 2 premières générations en cours */}
        {activeGenerations.length > 0 && (
          <div className="mt-3 space-y-2">
            {activeGenerations.slice(0, 2).map((generation) => (
              <div
                key={generation.id}
                className="flex items-center justify-between p-2 rounded-md bg-background/50"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {generation.title || 'Histoire personnalisée'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={generation.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {generation.status === 'pending' && 'En cours'}
                    {generation.status === 'completed' && 'Terminé'}
                    {generation.status === 'error' && 'Erreur'}
                  </Badge>
                  
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(generation.startTime), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </span>
                </div>
              </div>
            ))}
            
            {activeGenerations.length > 2 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{activeGenerations.length - 2} autre{activeGenerations.length - 2 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingStoriesIndicator;