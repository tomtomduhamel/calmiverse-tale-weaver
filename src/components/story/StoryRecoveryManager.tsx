
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Clock } from "lucide-react";
import { useStoryRecovery } from "@/hooks/stories/monitoring/useStoryRecovery";
import type { Story } from "@/types/story";

interface StoryRecoveryManagerProps {
  stories: Story[];
  onRecoveryComplete?: () => void;
}

/**
 * Composant pour gérer la récupération des histoires bloquées ou échouées
 */
export const StoryRecoveryManager: React.FC<StoryRecoveryManagerProps> = ({
  stories,
  onRecoveryComplete
}) => {
  const { recoverStuckStory, recoverAllFailedStories } = useStoryRecovery();

  const pendingStories = stories.filter(s => s.status === 'pending');
  const errorStories = stories.filter(s => s.status === 'error');
  const stuckStories = pendingStories.filter(s => {
    const timeDiff = Date.now() - new Date(s.createdAt).getTime();
    return timeDiff > 10 * 60 * 1000; // Plus de 10 minutes
  });

  const handleRecoverStory = async (story: Story) => {
    const success = await recoverStuckStory(story);
    if (success && onRecoveryComplete) {
      onRecoveryComplete();
    }
  };

  const handleRecoverAll = async () => {
    await recoverAllFailedStories([...stuckStories, ...errorStories]);
    if (onRecoveryComplete) {
      onRecoveryComplete();
    }
  };

  if (stuckStories.length === 0 && errorStories.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          Histoires nécessitant une attention
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stuckStories.length > 0 && (
          <div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              {stuckStories.length} histoire(s) bloquée(s) en génération depuis plus de 10 minutes
            </p>
            <div className="space-y-2">
              {stuckStories.map(story => (
                <div key={story.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <span className="text-sm font-medium truncate flex-1">{story.title}</span>
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
            </div>
          </div>
        )}

        {(stuckStories.length > 1 || errorStories.length > 1) && (
          <div className="pt-2 border-t">
            <Button 
              onClick={handleRecoverAll}
              className="w-full"
              variant="default"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Récupérer toutes les histoires ({stuckStories.length + errorStories.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryRecoveryManager;
