import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, XCircle, Eye, Sparkles } from 'lucide-react';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

/**
 * Carte compacte affichant les générations d'histoires actives sur l'accueil
 * Optimisée pour être discrète mais informative
 */
export const ActiveGenerationsCard: React.FC = () => {
  const { activeGenerations, totalActiveCount } = useBackgroundStoryGeneration();
  const navigate = useNavigate();

  // Ne rien afficher s'il n'y a pas de générations actives
  if (totalActiveCount === 0) {
    return null;
  }

  const pendingCount = activeGenerations.filter(gen => gen.status === 'pending').length;
  const completedCount = activeGenerations.filter(gen => gen.status === 'completed').length;
  const errorCount = activeGenerations.filter(gen => gen.status === 'error').length;

  const handleViewLibrary = () => {
    navigate('/library');
  };

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Générations en cours
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleViewLibrary}
            className="h-6 px-2 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Voir tout
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Résumé rapide */}
        <div className="flex items-center gap-3 mb-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-xs font-medium">{pendingCount} en cours</span>
            </div>
          )}
          
          {completedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 h-5 text-xs">
              <CheckCircle className="h-2 w-2 mr-1" />
              {completedCount} prête{completedCount > 1 ? 's' : ''}
            </Badge>
          )}
          
          {errorCount > 0 && (
            <Badge variant="destructive" className="h-5 text-xs">
              <XCircle className="h-2 w-2 mr-1" />
              {errorCount} erreur{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Liste des générations récentes (max 2 pour rester compact) */}
        <div className="space-y-1">
          {activeGenerations.slice(0, 2).map((generation) => (
            <div 
              key={generation.id} 
              className="flex items-center justify-between text-xs text-muted-foreground p-1 rounded bg-muted/30"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {generation.status === 'pending' && (
                  <Clock className="h-2 w-2 text-orange-500 flex-shrink-0" />
                )}
                {generation.status === 'completed' && (
                  <CheckCircle className="h-2 w-2 text-green-500 flex-shrink-0" />
                )}
                {generation.status === 'error' && (
                  <XCircle className="h-2 w-2 text-red-500 flex-shrink-0" />
                )}
                <span className="truncate flex-1">{generation.title}</span>
              </div>
              <span className="text-xs text-muted-foreground/70 flex-shrink-0 ml-2">
                {formatDistanceToNow(generation.startTime, { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </span>
            </div>
          ))}
          
          {activeGenerations.length > 2 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              +{activeGenerations.length - 2} autre{activeGenerations.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};