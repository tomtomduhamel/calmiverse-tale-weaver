import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Check, BookOpen, Star, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story } from "@/types/story";

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

  const handleClick = () => {
    if (story.status === 'completed') {
      onClick();
    }
  };

  return (
    <Card 
      className={`
        p-4 transition-all duration-300 relative cursor-pointer
        bg-gradient-to-br from-card-start to-card-end
        hover:from-card-hover-start hover:to-card-hover-end
        shadow-soft hover:shadow-soft-lg animate-fade-in
        ${story.status === 'completed' ? 'hover:scale-105 active:scale-98' : ''}
      `}
      onClick={handleClick}
    >
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`text-yellow-500 hover:text-yellow-600 bg-white/80 hover:bg-white/90 ${
            story.isFavorite ? 'text-yellow-500' : 'text-gray-400'
          }`}
          onClick={toggleFavorite}
        >
          <Star className="h-4 w-4" fill={story.isFavorite ? "currentColor" : "none"} />
        </Button>
        {isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:text-primary/90 bg-white/80 hover:bg-white/90"
            onClick={saveTitle}
          >
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-secondary/90 bg-white/80 hover:bg-white/90"
            onClick={startEditing}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-secondary hover:text-destructive bg-white/80 hover:bg-white/90"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="mb-2 font-semibold"
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <h3 className="text-lg font-semibold mb-2 text-secondary-dark">
          {story.title}
        </h3>
      )}

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {story.preview}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-secondary/20 text-secondary-dark px-2 py-1 rounded-full">
          {story.objective}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          story.status === 'pending' 
            ? 'bg-yellow-200 text-yellow-800' 
            : 'bg-green-200 text-green-800'
        }`}>
          {story.status === 'pending' ? 'En cours' : 'Terminée'}
        </span>
        {story.tags?.map((tag, index) => (
          <span key={index} className="text-xs bg-accent/20 text-accent-dark px-2 py-1 rounded-full flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Créée le {format(story.createdAt, "d MMMM yyyy", { locale: fr })}
      </p>
      
      {story.status === 'completed' && (
        <Button
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4 flex items-center gap-2"
          onClick={handleClick}
        >
          <BookOpen className="w-4 h-4" />
          Lire l'histoire complète
        </Button>
      )}
    </Card>
  );
};

export default StoryCard;