import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock } from "lucide-react";
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
  const [editingTitle, setEditingTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingTitle(story.title);
  };

  const saveTitle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", story.id);
      await updateDoc(storyRef, {
        title: editingTitle
      });

      toast({
        title: "Titre mis à jour",
        description: "Le titre de l'histoire a été modifié avec succès",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le titre",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", story.id);
      await updateDoc(storyRef, {
        isFavorite: !story.isFavorite
      });
      toast({
        title: story.isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
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

  const handleCardClick = () => {
    if (story.status === 'pending') {
      toast({
        title: "Histoire en cours de génération",
        description: "Cette histoire n'est pas encore disponible à la lecture",
        variant: "warning",
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
        ${story.status === 'completed' ? 'cursor-pointer hover:scale-105 active:scale-98' : 'cursor-default'}
      `}
      onClick={handleCardClick}
      role={story.status === 'completed' ? "button" : undefined}
      tabIndex={story.status === 'completed' ? 0 : undefined}
      onKeyDown={(e) => {
        if (story.status === 'completed' && (e.key === 'Enter' || e.key === ' ')) {
          handleCardClick();
        }
      }}
    >
      <StoryCardActions
        isEditing={isEditing}
        isFavorite={story.isFavorite || false}
        onToggleFavorite={toggleFavorite}
        onSaveTitle={saveTitle}
        onStartEditing={startEditing}
        onDelete={onDelete}
      />

      <StoryCardTitle
        isEditing={isEditing}
        title={story.title}
        editingTitle={editingTitle}
        onEditingTitleChange={setEditingTitle}
      />

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {story.preview}
      </p>

      <StoryCardTags
        tags={story.tags || []}
        objective={story.objective}
        status={story.status}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        Créée le {format(story.createdAt, "d MMMM yyyy", { locale: fr })}
      </p>
      
      {story.status === 'completed' ? (
        <Button
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4 flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          <BookOpen className="w-4 h-4" />
          Lire l'histoire complète
        </Button>
      ) : (
        <Button
          className="w-full bg-secondary/50 cursor-not-allowed mt-4 flex items-center gap-2"
          disabled
        >
          <Clock className="w-4 h-4" />
          Génération en cours...
        </Button>
      )}
    </Card>
  );
};

export default StoryCard;