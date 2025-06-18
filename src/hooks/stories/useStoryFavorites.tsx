
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Story } from '@/types/story';

export const useStoryFavorites = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const toggleFavorite = async (storyId: string, currentFavoriteStatus: boolean): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      const newFavoriteStatus = !currentFavoriteStatus;
      
      const { error } = await supabase
        .from('stories')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', storyId);
      
      if (error) {
        console.error('Erreur lors de la mise à jour du favori:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le favori",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: newFavoriteStatus ? "Ajouté aux favoris" : "Retiré des favoris",
        description: newFavoriteStatus 
          ? "L'histoire a été ajoutée à vos favoris" 
          : "L'histoire a été retirée de vos favoris",
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const getFavoriteStories = (stories: Story[]): Story[] => {
    return stories.filter(story => story.isFavorite);
  };

  return {
    toggleFavorite,
    getFavoriteStories,
    isUpdating
  };
};
