import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story } from "@/types/story";
import StoryCardActions from "./card/StoryCardActions";
import StoryCardTags from "./card/StoryCardTags";
import StoryCardTitle from "./card/StoryCardTitle";

interface StoryCardProps {
  story: Story;
  onDelete: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const StoryCard = ({ story, onDelete, onClick }: StoryCardProps) => {
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(story.isFavorite || false);

  const formatTitle = (text: string) => {
    // Enlever les guillemets au début et à la fin
    let formattedText = text.replace(/^["']|["']$/g, '').trim();

    // Gérer les titres avec ###
    if (formattedText.startsWith('###')) {
      return formattedText.replace(/^###\s*/, '');
    }
    
    // Gérer le texte en gras avec **
    if (formattedText.startsWith('**') && formattedText.endsWith('**')) {
      return formattedText.replace(/^\*\*|\*\*$/g, '');
    }

    // Texte normal
    return formattedText;
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", story.id);
      const newFavoriteStatus = !isFavorite;
      await updateDoc(storyRef, {
        isFavorite: newFavoriteStatus
      });
      setIsFavorite(newFavoriteStatus);
      toast({
        title: newFavoriteStatus ? "Ajouté aux favoris" : "Retiré des favoris",
        description: "Mise à jour effectuée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les favoris",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", story.id);
      const newStatus = story.status === 'read' ? 'completed' : 'read';
      await updateDoc(storyRef, {
        status: newStatus
      });
      toast({
        title: newStatus === 'read' ? "Histoire marquée comme lue" : "Histoire marquée comme non lue",
        description: "Mise à jour effectuée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de lecture",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = () => {
    if (story.status === 'pending') {
      toast({
        title: "Histoire en cours de génération",
        description: "Cette histoire n'est pas encore disponible à la lecture. Nous vous notifierons dès qu'elle sera prête !",
      });
      return;
    }
    onClick();
  };

  return (
    <Card 
      className={`
        p-4 transition-all duration-300 relative
        bg-gradient-to-br from-card-start to-card-end
        hover:from-card-hover-start hover:to-card-hover-end
        shadow-soft hover:shadow-soft-lg animate-fade-in
        ${story.status === 'completed' || story.status === 'read' ? 'cursor-pointer hover:scale-105 active:scale-98' : 'cursor-default'}
      `}
      onClick={handleCardClick}
      role={story.status === 'completed' || story.status === 'read' ? "button" : undefined}
      tabIndex={story.status === 'completed' || story.status === 'read' ? 0 : undefined}
      onKeyDown={(e) => {
        if ((story.status === 'completed' || story.status === 'read') && (e.key === 'Enter' || e.key === ' ')) {
          handleCardClick();
        }
      }}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow">
            <h3 className="text-lg font-semibold">{formatTitle(story.title)}</h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Pour : {story.childrenNames?.join(', ') || 'Non spécifié'}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <StoryCardActions
              isFavorite={isFavorite}
              isRead={story.status === 'read'}
              onToggleFavorite={toggleFavorite}
              onMarkAsRead={markAsRead}
              onDelete={onDelete}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {story.status === 'pending' ? "Histoire en cours de génération..." : story.story_summary}
        </p>

        <StoryCardTags
          tags={story.tags || []}
          objective={story.objective}
          status={story.status}
        />
        
        <p className="text-xs text-muted-foreground">
          Créée le {format(story.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
        
        {story.status === 'pending' ? (
          <Button
            className="w-full bg-secondary/50 cursor-not-allowed flex items-center gap-2 animate-pulse"
            disabled
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Génération en cours...
          </Button>
        ) : (
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            <BookOpen className="w-4 h-4" />
            Lire l'histoire complète
          </Button>
        )}
      </div>
    </Card>
  );
};

export default StoryCard;
