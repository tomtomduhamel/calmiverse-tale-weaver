import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoryDurationMinutes } from '@/types/story';

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

interface MobileTitleSelectorProps {
  titles: GeneratedTitle[];
  onSelectTitle: (title: string, duration: StoryDurationMinutes) => void;
  onRegenerateTitles?: () => void;
  canRegenerate?: boolean;
  isCreatingStory?: boolean;
  isRegenerating?: boolean;
}

const MobileTitleSelector: React.FC<MobileTitleSelectorProps> = ({
  titles,
  onSelectTitle,
  onRegenerateTitles,
  canRegenerate = false,
  isCreatingStory = false,
  isRegenerating = false
}) => {

  const handleTitleClick = (title: string, duration: StoryDurationMinutes) => {
    onSelectTitle(title, duration);
  };

  if (titles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {/* Boutons de génération compacts */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {titles.length} titre{titles.length > 1 ? 's' : ''}
        </Badge>
        
        {canRegenerate && onRegenerateTitles && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateTitles}
            disabled={isRegenerating || isCreatingStory}
            className="text-xs h-7"
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

      {/* Liste des titres */}
      <div className="space-y-3">
        {titles.map((title, index) => (
          <Card key={title.id} className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Titre et numéro */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground leading-tight flex-1">
                    {title.title}
                  </h3>
                  <Badge variant="outline" className="text-xs shrink-0">
                    #{index + 1}
                  </Badge>
                </div>

                {/* Boutons de durée compacts */}
                <div className="grid grid-cols-3 gap-2">
                  {([5, 10, 15] as StoryDurationMinutes[]).map(duration => (
                    <Button
                      key={duration}
                      variant="default"
                      size="sm"
                      onClick={() => handleTitleClick(title.title, duration)}
                      disabled={isCreatingStory || isRegenerating}
                      className="h-8 text-xs font-medium"
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
    </div>
  );
};

export default MobileTitleSelector;