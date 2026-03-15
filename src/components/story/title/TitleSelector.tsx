import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STORY_DURATION_OPTIONS, StoryDurationMinutes } from '@/types/story';
import MobileTitleSelector from './mobile/MobileTitleSelector';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Video, Sparkles, Lock, BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubscriptionLimits } from '@/types/subscription';

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

interface TitleSelectorProps {
  titles: GeneratedTitle[];
  onSelectTitle: (title: string, durationMinutes: StoryDurationMinutes, generateVideo: boolean) => void;
  onRegenerateTitles?: () => void;
  canRegenerate?: boolean;
  isCreatingStory: boolean;
  isRegenerating?: boolean;
  videoQuota?: {
    used: number;
    limit: number;
  };
  storyQuota?: {
    used: number;
    limit: number;
  };
  limits: SubscriptionLimits | null;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({
  titles,
  onSelectTitle,
  onRegenerateTitles,
  canRegenerate = false,
  isCreatingStory,
  isRegenerating = false,
  videoQuota,
  storyQuota,
  limits,
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [generateVideo, setGenerateVideo] = React.useState(true);

  // Désactiver la vidéo par défaut si pas de quota
  React.useEffect(() => {
    if (limits && limits.max_video_intros_per_period === 0) {
      setGenerateVideo(false);
    }
  }, [limits]);

  const canGenerateVideo = (limits?.max_video_intros_per_period || 0) > 0;

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
        videoQuota={videoQuota}
        storyQuota={storyQuota}
        limits={limits}
        generateVideo={generateVideo}
        setGenerateVideo={setGenerateVideo}
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {titles.length} titre{titles.length > 1 ? 's' : ''} généré{titles.length > 1 ? 's' : ''}
          </Badge>

          {/* Bloc unifié "Vos crédits ce mois" */}
          <div className="flex flex-col gap-3 px-5 py-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vos crédits ce mois</p>
            
            {/* Ligne Histoires */}
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium w-16 shrink-0">Histoires</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${Math.min(100, ((storyQuota?.used || 0) / Math.max(1, storyQuota?.limit || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                {Math.max(0, (storyQuota?.limit || 0) - (storyQuota?.used || 0))}/{storyQuota?.limit || 0}
              </span>
            </div>

            {/* Ligne Vidéos */}
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium w-16 shrink-0 flex items-center gap-1">
                Vidéos
                {!canGenerateVideo && <Lock className="w-3 h-3 text-muted-foreground" />}
              </span>
              {canGenerateVideo ? (
                <>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${Math.min(100, ((videoQuota?.used || 0) / Math.max(1, videoQuota?.limit || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                    {Math.max(0, (videoQuota?.limit || 0) - (videoQuota?.used || 0))}/{videoQuota?.limit || 0}
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-muted-foreground font-medium flex-1">
                  Réservé aux plans Calmix+
                </span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Switch
                        id="global-video-toggle"
                        checked={generateVideo}
                        onCheckedChange={setGenerateVideo}
                        disabled={!canGenerateVideo || isCreatingStory}
                        className="data-[state=checked]:bg-primary scale-90"
                      />
                    </div>
                  </TooltipTrigger>
                  {!canGenerateVideo && (
                    <TooltipContent side="bottom">
                      <p>Passez au plan Calmix ou supérieur !</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {canRegenerate && onRegenerateTitles && (
            <Button
              onClick={onRegenerateTitles}
              disabled={isRegenerating || isCreatingStory}
              variant="outline"
              size="sm"
              className="text-sm rounded-full px-4"
            >
              {isRegenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Génération...
                </>
              ) : (
                "Générer +3 titres"
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
                <div className="grid grid-cols-3 gap-3">
                  {STORY_DURATION_OPTIONS.map((duration) => (
                    <Button
                      key={duration}
                      onClick={() => onSelectTitle(title.title, duration, generateVideo)}
                      disabled={isCreatingStory || isRegenerating}
                      variant="secondary"
                      size="sm"
                      className="h-10 hover:bg-primary/10 hover:text-primary transition-colors border-none"
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