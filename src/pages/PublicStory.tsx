
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Story } from "@/types/story";
import { supabase } from '@/integrations/supabase/client';
import StoryReader from "@/components/StoryReader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingStory from "@/components/LoadingStory";

const PublicStory = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        if (!storyId) {
          toast({
            title: "Erreur",
            description: "Identifiant d'histoire manquant",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        const { data: storyData, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (error || !storyData) {
          toast({
            title: "Erreur",
            description: "Cette histoire n'existe pas",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Transformer les données pour correspondre au type Story attendu
        const formattedStory: Story = {
          id: storyData.id,
          title: storyData.title,
          authorId: storyData.authorid,
          preview: storyData.preview,
          objective: storyData.objective,
          childrenIds: storyData.childrenids || [],
          childrenNames: storyData.childrennames || [],
          status: storyData.status,
          story_text: storyData.content,
          story_summary: storyData.summary,
          createdAt: new Date(storyData.createdat),
        };

        setStory(formattedStory);
      } catch (error) {
        console.error("Erreur lors du chargement de l'histoire:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'histoire",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId, navigate, toast]);

  const handleClose = () => {
    navigate("/");
  };

  if (isLoading) {
    return <LoadingStory />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {story ? (
          <StoryReader
            story={story}
            onClose={handleClose}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Cette histoire n'est pas disponible ou a été supprimée.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicStory;
