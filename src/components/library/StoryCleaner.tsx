
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useStoryCleaner } from '@/hooks/stories/useStoryCleaner';
import type { Story } from '@/types/story';

interface StoryCleanerProps {
  stories: Story[];
}

const StoryCleaner: React.FC<StoryCleanerProps> = ({ stories }) => {
  const { cleanReadStories, isLoading } = useStoryCleaner();

  const handleCleanup = async () => {
    if (window.confirm('Voulez-vous supprimer toutes les histoires lues ?')) {
      await cleanReadStories(stories);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleCleanup}
      disabled={isLoading}
      className="gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {isLoading ? 'Nettoyage...' : 'Nettoyer les histoires lues'}
    </Button>
  );
};

export default StoryCleaner;
