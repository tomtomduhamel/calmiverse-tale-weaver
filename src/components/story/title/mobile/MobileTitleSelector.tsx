import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, Video, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoryDurationMinutes } from '@/types/story';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SubscriptionLimits } from '@/types/subscription';

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

interface MobileTitleSelectorProps {
  titles: GeneratedTitle[];
  onSelectTitle: (title: string, duration: StoryDurationMinutes, generateVideo: boolean) => void;
  onRegenerateTitles?: () => void;
  canRegenerate?: boolean;
  isCreatingStory?: boolean;
  isRegenerating?: boolean;
  videoQuota?: {
    used: number;
    limit: number;
  };
  limits: SubscriptionLimits | null;
  generateVideo: boolean;
  setGenerateVideo: (val: boolean) => void;
}

const MobileTitleSelector: React.FC<MobileTitleSelectorProps> = ({
  titles,
  onSelectTitle,
  onRegenerateTitles,
  canRegenerate = false,
  isCreatingStory = false,
  isRegenerating = false,
  videoQuota,
  limits,
  generateVideo,
  setGenerateVideo
}) => {
  const canGenerateVideo = (limits?.max_video_intros_per_period || 0) > 0;

  const handleTitleClick = (title: string, duration: StoryDurationMinutes) => {
    onSelectTitle(title, duration, generateVideo);
  };

  if (titles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header avec compteur et bouton de regénération */}
      <div className="flex items-center justify-center gap-3 px-2">
        <Badge variant="secondary" className="text-xs px-2 py-1">
          {titles.length} titre{titles.length > 1 ? 's' : ''}
        </Badge>
        
        {canRegenerate && onRegenerateTitles && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateTitles}
            disabled={isRegenerating || isCreatingStory}
            className="text-xs h-7 px-3"
          >
            {isRegenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            +3 titres
          </Button>
        )}
      </div>

      {/* Liste des titres avec largeur maximale optimisée */}
      <div className="space-y-3 max-w-md mx-auto">
        {titles.map((title, index) => (
          <Card key={title.id} className="shadow-sm border">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Titre et numéro */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium text-foreground leading-snug flex-1">
                    {title.title}
                  </h3>
                  <Badge variant="outline" className="text-xs shrink-0 px-2 py-0.5">
                    #{index + 1}
                  </Badge>
                </div>

                {/* Switch Vidéo */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        Vidéo magique ✨
                        {!canGenerateVideo && <Lock className="w-2.5 h-2.5 text-muted-foreground" />}
                      </Label>
                      <p className="text-[9px] text-muted-foreground">
                        {canGenerateVideo 
                          ? `${videoQuota?.used || 0}/${videoQuota?.limit || 0}`
                          : "Plan supérieur requis"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={generateVideo}
                    onCheckedChange={setGenerateVideo}
                    disabled={!canGenerateVideo || isCreatingStory}
                    className="scale-90"
                  />
                </div>

                {/* Boutons de durée */}
                <div className="grid grid-cols-3 gap-2">
                  {([5, 10, 15] as StoryDurationMinutes[]).map(duration => (
                    <Button
                      key={duration}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTitleClick(title.title, duration)}
                      disabled={isCreatingStory || isRegenerating}
                      className="h-9 text-xs font-medium"
                    >
                      {duration} min
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message d'état */}
      {titles.length < 6 && (
        <p className="text-xs text-muted-foreground text-center px-4">
          {titles.length === 3 ? 
            "Vous pouvez générer 3 titres supplémentaires si nécessaire" :
            `${titles.length} titre${titles.length > 1 ? 's' : ''} disponible${titles.length > 1 ? 's' : ''}`
          }
        </p>
      )}
    </div>
  );
};

export default MobileTitleSelector;