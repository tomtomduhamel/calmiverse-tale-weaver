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

          {/* New Centralized Video Toggle */}
          <div className="flex items-center gap-6 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Video className="w-5 h-5 text-primary" />
              </div>
               <div className="flex flex-col">
                <Label htmlFor="global-video-toggle" className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                  Vidéo magique ✨
                  {!canGenerateVideo && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {canGenerateVideo ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${Math.min(100, ((videoQuota?.used || 0) / Math.max(1, videoQuota?.limit || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {Math.max(0, (videoQuota?.limit || 0) - (videoQuota?.used || 0))} restante{Math.max(0, (videoQuota?.limit || 0) - (videoQuota?.used || 0)) !== 1 ? 's' : ''} sur {videoQuota?.limit || 0}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Indisponible avec votre plan
                  </p>
                )}
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Switch
                      id="global-video-toggle"
                      checked={generateVideo}
                      onCheckedChange={setGenerateVideo}
                      disabled={!canGenerateVideo || isCreatingStory}
                      className="data-[state=checked]:bg-primary"
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