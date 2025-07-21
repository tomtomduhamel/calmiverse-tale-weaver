import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Clock, RefreshCw, Trash2, Wrench } from "lucide-react";
import { useStoryRecovery } from "@/hooks/stories/monitoring/useStoryRecovery";
import { useStoryCleanup } from "@/hooks/stories/useStoryCleanup";
import { useToast } from "@/hooks/use-toast";
import StoryGenerationDiagnostic from "./StoryGenerationDiagnostic";
import type { Story } from "@/types/story";
interface StoryRecoveryManagerProps {
  stories: Story[];
  onRecoveryComplete?: () => void;
}

/**
 * Composant de récupération radical avec nettoyage automatique
 */
export const StoryRecoveryManager: React.FC<StoryRecoveryManagerProps> = ({
  stories,
  onRecoveryComplete
}) => {
  const {
    recoverStuckStory
  } = useStoryRecovery();
  const {
    cleanupZombieStories,
    forceRecoverStory
  } = useStoryCleanup();
  const {
    toast
  } = useToast();
  const pendingStories = stories.filter(s => s.status === 'pending');
  const errorStories = stories.filter(s => s.status === 'error');

  // Histoires zombie (plus de 2 minutes pour diagnostic rapide)
  const zombieStories = pendingStories.filter(s => {
    const timeDiff = Date.now() - new Date(s.createdAt).getTime();
    return timeDiff > 2 * 60 * 1000; // Plus de 2 minutes
  });
  const handleCleanupAll = async () => {
    console.log('[StoryRecoveryManager] Nettoyage complet demandé');
    try {
      const result = await cleanupZombieStories();
      if (onRecoveryComplete) {
        onRecoveryComplete();
      }
      toast({
        title: "Nettoyage terminé",
        description: `${result.cleaned} histoires zombie nettoyées`
      });
    } catch (error) {
      console.error('[StoryRecoveryManager] Erreur nettoyage:', error);
    }
  };
  const handleForceRecover = async (story: Story) => {
    console.log(`[StoryRecoveryManager] Récupération forcée: ${story.id}`);
    const success = await forceRecoverStory(story.id);
    if (success && onRecoveryComplete) {
      onRecoveryComplete();
    }
  };
  const hasProblems = zombieStories.length > 0 || errorStories.length > 0;
  if (!hasProblems) {
    return;
  }
  return <div className="space-y-4">
      {/* Diagnostic système intégré */}
      <StoryGenerationDiagnostic stories={stories} onRecoveryComplete={onRecoveryComplete} />
      
      {/* Nettoyage radical */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Wrench className="h-5 w-5" />
            Récupération Radicale ({zombieStories.length + errorStories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {zombieStories.length > 0 && <div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                {zombieStories.length} histoire(s) zombie détectée(s)
              </p>
              <div className="space-y-2">
                {zombieStories.slice(0, 3).map(story => <div key={story.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{story.title}</span>
                      <span className="text-xs text-red-600 dark:text-red-400 truncate block">
                        Bloquée depuis {Math.round((Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60))} min
                      </span>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => handleForceRecover(story)} className="ml-2">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Forcer
                    </Button>
                  </div>)}
              </div>
            </div>}

          {errorStories.length > 0 && <div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {errorStories.length} histoire(s) en erreur
              </p>
              <div className="space-y-2">
                {errorStories.slice(0, 2).map(story => <div key={story.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{story.title}</span>
                      {story.error && <span className="text-xs text-red-600 dark:text-red-400 truncate block">
                          {story.error}
                        </span>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleForceRecover(story)} className="ml-2">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </div>)}
              </div>
            </div>}

          <div className="pt-2 border-t space-y-2">
            <Button onClick={handleCleanupAll} className="w-full" variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyage Radical ({zombieStories.length + errorStories.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default StoryRecoveryManager;