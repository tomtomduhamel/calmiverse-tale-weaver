
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Clock, RefreshCw } from "lucide-react";
import { useStoryRecovery } from "@/hooks/stories/monitoring/useStoryRecovery";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";

interface StoryRecoveryManagerProps {
  stories: Story[];
  onRecoveryComplete?: () => void;
}

/**
 * Composant pour gérer la récupération des histoires bloquées ou échouées
 * Maintenant avec nettoyage des histoires "zombies"
 */
export const StoryRecoveryManager: React.FC<StoryRecoveryManagerProps> = ({
  stories,
  onRecoveryComplete
}) => {
  const { recoverStuckStory, recoverAllFailedStories } = useStoryRecovery();
  const { toast } = useToast();

  const pendingStories = stories.filter(s => s.status === 'pending');
  const errorStories = stories.filter(s => s.status === 'error');
  
  // Identifier les histoires "zombies" (pending depuis plus de 10 minutes)
  const stuckStories = pendingStories.filter(s => {
    const timeDiff = Date.now() - new Date(s.createdAt).getTime();
    return timeDiff > 10 * 60 * 1000; // Plus de 10 minutes
  });

  const handleRecoverStory = async (story: Story) => {
    console.log(`[StoryRecoveryManager] Récupération de l'histoire: ${story.id}`);
    const success = await recoverStuckStory(story);
    if (success && onRecoveryComplete) {
      onRecoveryComplete();
    }
  };

  const handleRecoverAll = async () => {
    console.log(`[StoryRecoveryManager] Récupération de toutes les histoires problématiques`);
    await recoverAllFailedStories([...stuckStories, ...errorStories]);
    if (onRecoveryComplete) {
      onRecoveryComplete();
    }
  };

  // Fonction pour nettoyer les histoires "zombies"
  const handleCleanupZombies = async () => {
    if (stuckStories.length === 0) {
      toast({
        title: "Aucun nettoyage nécessaire",
        description: "Aucune histoire bloquée détectée.",
      });
      return;
    }

    console.log(`[StoryRecoveryManager] Nettoyage de ${stuckStories.length} histoires zombies`);
    
    for (const story of stuckStories) {
      try {
        await recoverStuckStory(story);
      } catch (error) {
        console.error(`Erreur lors du nettoyage de l'histoire ${story.id}:`, error);
      }
    }

    toast({
      title: "Nettoyage terminé",
      description: `${stuckStories.length} histoires bloquées ont été relancées.`,
    });

    if (onRecoveryComplete) {
      onRecoveryComplete();
    }
  };

  if (stuckStories.length === 0 && errorStories.length === 0) {
    // Afficher un indicateur de santé du système
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Génération d'histoires opérationnelle</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          Histoires nécessitant une attention ({stuckStories.length + errorStories.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stuckStories.length > 0 && (
          <div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              {stuckStories.length} histoire(s) bloquée(s) en génération (plus de 10 minutes)
            </p>
            <div className="space-y-2">
              {stuckStories.slice(0, 3).map(story => (
                <div key={story.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{story.title}</span>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 truncate block">
                      Créée il y a {Math.round((Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60))} minutes
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecoverStory(story)}
                    className="ml-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Relancer
                  </Button>
                </div>
              ))}
              {stuckStories.length > 3 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  ... et {stuckStories.length - 3} autre(s)
                </p>
              )}
            </div>
          </div>
        )}

        {errorStories.length > 0 && (
          <div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {errorStories.length} histoire(s) en erreur
            </p>
            <div className="space-y-2">
              {errorStories.slice(0, 3).map(story => (
                <div key={story.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{story.title}</span>
                    {story.error && (
                      <span className="text-xs text-red-600 dark:text-red-400 truncate block">
                        {story.error}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecoverStory(story)}
                    className="ml-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Réessayer
                  </Button>
                </div>
              ))}
              {errorStories.length > 3 && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  ... et {errorStories.length - 3} autre(s)
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t space-y-2">
          {stuckStories.length > 0 && (
            <Button 
              onClick={handleCleanupZombies}
              className="w-full"
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Nettoyer les histoires bloquées ({stuckStories.length})
            </Button>
          )}
          
          {(stuckStories.length > 1 || errorStories.length > 1) && (
            <Button 
              onClick={handleRecoverAll}
              className="w-full"
              variant="default"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Récupérer toutes les histoires ({stuckStories.length + errorStories.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryRecoveryManager;
