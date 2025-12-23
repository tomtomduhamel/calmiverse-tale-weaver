
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Story } from "@/types/story";
import { supabase } from '@/integrations/supabase/client';
import StoryReader from "@/components/StoryReader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatStoryFromSupabase } from "@/hooks/stories/storyFormatters";

const SharedStory = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const logAccess = async (storyId: string) => {
    try {
      const accessLog = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || "direct",
      };

      // Enregistrer l'accès dans Supabase - table d'analyse
      const { error } = await supabase
        .from('story_access_logs')
        .insert({
          story_id: storyId,
          access_data: accessLog
        });
        
      if (error) {
        console.error("Erreur lors de l'enregistrement de l'accès:", error);
      } else {
        console.log("Accès enregistré avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'accès:", error);
      // On ne montre pas d'erreur à l'utilisateur car ce n'est pas critique
    }
  };

  useEffect(() => {
    const fetchSharedStory = async () => {
      try {
        // Token vient de l'URL path via useParams, storyId des query params
        const params = new URLSearchParams(location.search);
        const storyId = params.get("id");

        if (!storyId || !token) {
          toast({
            title: "Erreur",
            description: "Lien de partage invalide",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Récupérer l'histoire depuis Supabase
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

        // Vérifier si l'histoire est partagée publiquement et si le token correspond
        const sharingData = storyData.sharing || {};
        const publicAccess = sharingData.publicAccess || {};
        
        if (!publicAccess.enabled || 
            publicAccess.token !== token ||
            new Date(publicAccess.expiresAt) < new Date()) {
          toast({
            title: "Erreur",
            description: "Ce lien de partage a expiré ou n'est plus valide",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Transformer les données pour correspondre au type Story attendu
        const formattedStory = formatStoryFromSupabase(storyData);
        setStory(formattedStory);
        
        // Log de l'accès une fois que l'histoire est validée
        await logAccess(storyId);
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

    fetchSharedStory();
  }, [location.search, navigate, toast, token]);

  const handleClose = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'histoire...</p>
        </div>
      </div>
    );
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

export default SharedStory;
