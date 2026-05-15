import React from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardActions from "./card/StoryCardActions";
import StoryCardTags from "./card/StoryCardTags";
import { FavoriteButton } from "../story/FavoriteButton";
import { MarkAsReadButton } from "../story/reader/MarkAsReadButton";
import { SeriesIndicator } from "../story/series/SeriesIndicator";
import { SeriesStoryCardStatus } from "./series/SeriesStoryCardStatus";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2, BookCheck, Sparkles } from "lucide-react";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";
interface StoryCardProps {
  story: Story;
  onClick?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  onSequelCreated?: (storyId: string) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
  isPending?: boolean;
  isUpdatingFavorite?: boolean;
  isUpdatingReadStatus?: boolean;
  isInSeries?: boolean; // NOUVEAU: Indique si la carte fait partie d'une vue de série
}
const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onClick,
  onDelete,
  onRetry,
  onToggleFavorite,
  onMarkAsRead,
  onSequelCreated,
  isRetrying = false,
  isDeleting = false,
  isPending = false,
  isUpdatingFavorite = false,
  isUpdatingReadStatus = false,
  isInSeries = false
}) => {
  // Toutes les histoires sont maintenant cliquables
  const isClickable = true;

  // Vérifier si l'histoire est récente (dernières 24h)
  const isRecentStory = (): boolean => {
    const now = new Date();
    const storyDate = new Date(story.createdAt);
    const hoursDiff = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };
  const isRecent = isRecentStory();

  // Styles différents pour les cartes en série vs cartes standalone
  const cardStyles = [
    "relative overflow-hidden transition-all duration-400 ease-calm animate-fade-up-slow",
    isInSeries
      ? "bg-card border-border/60 hover:border-primary-soft/50"
      : isClickable
        ? "cursor-pointer bg-card hover:-translate-y-0.5 hover:shadow-floating border-border/60"
        : "",
    // Style subtil pour pending
    story.status === "pending" || isPending
      ? "bg-gradient-to-br from-primary-soft/10 to-card border-primary-soft/40"
      : "",
    story.status === "read" ? "border-primary-soft/40 bg-primary-soft/5" : "",
    story.isFavorite ? "ring-1 ring-primary-soft/30" : "",
    isRecent && !isInSeries ? "border-primary-soft/50 bg-primary-soft/5" : "",
  ].join(" ");
  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: fr
    });
  };
  const handleCardClick = (e: React.MouseEvent) => {
    // Empêcher la propagation si le clic provient du bouton favori ou marquer comme lu
    if ((e.target as HTMLElement).closest('[data-favorite-button]') ||
      (e.target as HTMLElement).closest('[data-mark-as-read-button]') ||
      (e.target as HTMLElement).closest('[data-sequel-button]')) {
      return;
    }
    console.log("[StoryCard] DEBUG: Clic sur carte:", story.id, "status:", story.status);
    if (onClick) {
      console.log("[StoryCard] DEBUG: Appel du gestionnaire onClick sans conditions");
      document.body.style.cursor = "wait";
      setTimeout(() => {
        onClick();
        document.body.style.cursor = "default";
      }, 100);
    } else {
      console.log("[StoryCard] DEBUG: Aucun gestionnaire onClick fourni");
    }
  };
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher l'ouverture de l'histoire
    if (onToggleFavorite) {
      onToggleFavorite(story.id, story.isFavorite || false);
    }
  };
  const handleFavoriteToggle = () => {
    if (onToggleFavorite) {
      onToggleFavorite(story.id, story.isFavorite || false);
    }
  };
  const storyImageUrl = getStoryImageUrl(story.image_path);
  return <Card className={cardStyles} onClick={handleCardClick}>
    <CardContent className="pt-6 pb-2">
      {/* Image de couverture si disponible */}
      {storyImageUrl && <div className="mb-4 -mx-6 -mt-6">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img src={storyImageUrl} alt={`Illustration de ${story.title}`} className="w-full h-full object-cover transition-transform duration-700 ease-calm hover:scale-105" onError={e => {
            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent pointer-events-none" />
        </div>
      </div>}

      {/* Indicateur de série si l'histoire fait partie d'une série */}
      {story.tome_number && <div className="mb-3">
        <SeriesIndicator tomeNumber={story.tome_number} seriesTitle={story.series?.title} isSeriesStarter={story.is_series_starter} />
      </div>}

      {/* Statut visuel pour les cartes en série */}
      {isInSeries && <div className="mb-3">
        <SeriesStoryCardStatus status={story.status} tomeNumber={story.tome_number} />
      </div>}

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1">
          <StoryCardTitle title={story.title} status={story.status} isFavorite={story.isFavorite} />
          {isRecent && story.status !== "read" && <div className="flex items-center text-primary text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            <span className="font-medium">Nouveau</span>
          </div>}
          {story.status === "read" && <div className="flex items-center text-primary text-xs">
            <BookCheck className="h-3 w-3 mr-1" />
            <span className="font-medium">Lu</span>
          </div>}
        </div>

        {/* Bouton favoris */}
        <div data-favorite-button>
          <FavoriteButton isFavorite={story.isFavorite || false} onToggle={handleFavoriteToggle} isLoading={isUpdatingFavorite} size="sm" variant="ghost" />
        </div>
      </div>

      {/* Indicateur de lecture supprimé ici car déplacé à côté du titre */}

      <StoryCardTags status={story.status} objective={story.objective} tags={story.tags} error={story.error} />

      {/* Bouton marquer comme lu/non lu pour toutes les histoires */}
      {onMarkAsRead && <div className="mt-3" data-mark-as-read-button>
        <MarkAsReadButton storyId={story.id} onMarkAsRead={onMarkAsRead} isRead={story.status === "read"} isUpdatingReadStatus={isUpdatingReadStatus} isDarkMode={false} />
      </div>}
    </CardContent>
    <CardFooter className="flex justify-between pt-2 pb-4">
      <span className="text-xs text-muted-foreground">
        {/* Affichage différent pour les cartes en série */}
        {isInSeries ? story.status === "pending" || isPending ? <span className="flex items-center text-primary">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Génération en cours
        </span> : <span>{getTimeAgo(story.createdAt)}</span> : story.status === "pending" || isPending ? <span className="flex items-center text-primary">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          En génération...
        </span> : (story.status === "ready" || story.status === "read") && !story.video_path && story.settings?.generateVideo ? <span className="flex items-center text-primary">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Vidéo en préparation...
        </span> : <span className={isRecent ? "text-primary font-medium" : ""}>
          {getTimeAgo(story.createdAt)}
        </span>}
      </span>
      <StoryCardActions story={story} onDelete={onDelete} onRetry={onRetry} onSequelCreated={onSequelCreated} isRetrying={isRetrying} isDeleting={isDeleting} />
    </CardFooter>
  </Card>;
};
export default React.memo(StoryCard);