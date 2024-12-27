import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Check, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Story {
  id: string;
  title: string;
  preview: string;
  objective: string;
  createdAt: Date;
  status: 'pending' | 'completed';
  story_text?: string;
  story_summary?: string;
}

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory 
}) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleDelete = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (onDeleteStory) {
      onDeleteStory(storyId);
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès",
      });
    }
  };

  const handleCardClick = (story: Story) => {
    if (story.status === 'completed') {
      onSelectStory(story);
    }
  };

  const startEditing = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    setEditingId(story.id);
    setEditingTitle(story.title);
  };

  const saveTitle = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    try {
      const storyRef = doc(db, "stories", storyId);
      await updateDoc(storyRef, {
        title: editingTitle
      });

      toast({
        title: "Titre mis à jour",
        description: "Le titre de l'histoire a été modifié avec succès",
      });
      
      setEditingId(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le titre",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {stories.map((story) => (
        <Card 
          key={story.id} 
          className={`
            p-4 transition-all duration-300 relative cursor-pointer
            bg-gradient-to-br from-card-start to-card-end
            hover:from-card-hover-start hover:to-card-hover-end
            shadow-soft hover:shadow-soft-lg
            ${story.status === 'completed' ? 'hover:scale-105 active:scale-98' : ''}
          `}
          onClick={() => handleCardClick(story)}
        >
          <div className="absolute top-2 right-2 flex gap-2">
            {editingId === story.id ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary/90 bg-white/80 hover:bg-white/90"
                onClick={(e) => saveTitle(e, story.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-secondary hover:text-secondary/90 bg-white/80 hover:bg-white/90"
                onClick={(e) => startEditing(e, story)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-secondary hover:text-destructive bg-white/80 hover:bg-white/90"
              onClick={(e) => handleDelete(e, story.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {editingId === story.id ? (
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

          {story.story_summary && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {story.story_summary}
            </p>
          )}

          <div className="flex gap-2 mb-4">
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
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Créée le {format(story.createdAt, "d MMMM yyyy", { locale: fr })}
          </p>
          
          {story.status === 'completed' && (
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Lire l'histoire complète
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StoryLibrary;