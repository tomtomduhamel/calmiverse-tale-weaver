import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Indicateur discret des générations d'histoires en arrière-plan
 * Affiché de manière non-bloquante pour informer l'utilisateur
 */
export const BackgroundGenerationIndicator: React.FC = () => {
  const { activeGenerations, totalActiveCount } = useBackgroundStoryGeneration();

  // Ne rien afficher s'il n'y a pas de générations actives
  if (totalActiveCount === 0) {
    return null;
  }

  const pendingGenerations = activeGenerations.filter(gen => gen.status === 'pending');
  const completedGenerations = activeGenerations.filter(gen => gen.status === 'completed');
  const errorGenerations = activeGenerations.filter(gen => gen.status === 'error');

  return (
    <Card className="mb-4 border-l-4 border-l-primary bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {pendingGenerations.length > 0 && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {pendingGenerations.length} histoire{pendingGenerations.length > 1 ? 's' : ''} en cours
                </span>
              </div>
            )}
            
            {completedGenerations.length > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedGenerations.length} terminée{completedGenerations.length > 1 ? 's' : ''}
              </Badge>
            )}
            
            {errorGenerations.length > 0 && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {errorGenerations.length} erreur{errorGenerations.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = '/library'}
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir tout
          </Button>
        </div>

        {/* Détails des générations actives */}
        {activeGenerations.length > 0 && (
          <div className="mt-3 space-y-2">
            {activeGenerations.slice(0, 3).map((generation) => (
              <div 
                key={generation.id} 
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <div className="flex items-center space-x-2">
                  {generation.status === 'pending' && (
                    <Clock className="h-3 w-3 text-orange-500" />
                  )}
                  {generation.status === 'completed' && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  {generation.status === 'error' && (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span className="truncate max-w-48">{generation.title}</span>
                </div>
                <span>
                  {formatDistanceToNow(generation.startTime, { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </span>
              </div>
            ))}
            
            {activeGenerations.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{activeGenerations.length - 3} autre{activeGenerations.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};