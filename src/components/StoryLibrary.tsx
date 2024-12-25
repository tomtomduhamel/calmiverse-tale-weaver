import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Story {
  id: string;
  title: string;
  preview: string;
  theme: string;
  objective: string;
  createdAt: Date;
  status: 'pending' | 'completed';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {stories.map((story) => (
        <Card 
          key={story.id} 
          className="p-4 hover:shadow-lg transition-shadow animate-slide-in relative cursor-pointer"
          onClick={() => story.status === 'completed' ? onSelectStory(story) : null}
        >
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => handleDelete(e, story.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{story.preview}</p>
          <div className="flex gap-2 mb-4">
            <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
              {story.theme}
            </span>
            <span className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
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
          <p className="text-xs text-gray-500 mt-2">
            Créée le {format(story.createdAt, "d MMMM yyyy", { locale: fr })}
          </p>
          {story.status === 'completed' && (
            <Button
              className="w-full bg-accent hover:bg-accent/90 mt-4"
            >
              Lire
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StoryLibrary;