import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Trash2, 
  RotateCcw, 
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { Story } from '@/types/story';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SeriesStoryCardProps {
  story: Story;
  onClick: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onDelete?: (storyId: string) => void;
  onRetry?: (storyId: string) => void;
  isUpdatingFavorite?: boolean;
  isDeleting?: boolean;
  isRetrying?: boolean;
  isNextRecommended?: boolean;
  className?: string;
}

export const SeriesStoryCard: React.FC<SeriesStoryCardProps> = ({
  story,
  onClick,
  onToggleFavorite,
  onDelete,
  onRetry,
  isUpdatingFavorite,
  isDeleting,
  isRetrying,
  isNextRecommended = false,
  className = ""
}) => {
  const timeAgo = formatDistanceToNow(story.createdAt, { addSuffix: true, locale: fr });
  
  const getStatusIcon = () => {
    switch (story.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (story.status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Prête</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">En cours</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] bg-background border-border hover:border-primary/20 ${
        isNextRecommended ? 'ring-2 ring-primary/20 bg-primary/5' : ''
      } ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Image ou placeholder */}
          {story.image_path ? (
            <div className="w-12 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={story.image_path} 
                alt={story.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <svg class="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="w-12 h-16 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary/60" />
            </div>
          )}
          
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header avec tome et actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {story.tome_number && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    Tome {story.tome_number}
                  </Badge>
                )}
                {getStatusIcon()}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(story.id, story.isFavorite || false);
                    }}
                    disabled={isUpdatingFavorite}
                  >
                    {isUpdatingFavorite ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Star className={`w-3 h-3 ${story.isFavorite ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                    )}
                  </Button>
                )}
                
                {story.status === 'error' && onRetry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(story.id);
                    }}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3 text-blue-500" />
                    )}
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(story.id);
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-red-500" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Titre avec indicateur de recommandation */}
            <div className="flex items-start gap-2">
              <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {story.title}
              </h4>
              {isNextRecommended && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 whitespace-nowrap">
                  À lire
                </Badge>
              )}
            </div>
            
            {/* Métadonnées */}
            <div className="flex items-center justify-between gap-2">
              {getStatusBadge()}
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
            </div>
            
            {/* Preview du contenu */}
            {story.preview && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {story.preview}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};