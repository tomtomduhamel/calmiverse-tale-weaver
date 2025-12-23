import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Story } from "@/types/story";
import { supabase } from '@/integrations/supabase/client';
import PublicStoryReader from "@/components/story/PublicStoryReader";
import { useToast } from "@/hooks/use-toast";
import { formatStoryFromSupabase } from "@/hooks/stories/storyFormatters";

const SharedStory = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      await supabase
        .from('story_access_logs')
        .insert({
          story_id: storyId,
          access_data: accessLog
        });
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'accès:", err);
    }
  };

  useEffect(() => {
    const fetchSharedStory = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const storyId = params.get("id");

        if (!storyId || !token) {
          setError("Lien de partage invalide");
          return;
        }

        const { data: storyData, error: fetchError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (fetchError || !storyData) {
          setError("Cette histoire n'existe pas ou n'est plus disponible");
          return;
        }

        const sharingData = storyData.sharing || {};
        const publicAccess = sharingData.publicAccess || {};
        
        if (!publicAccess.enabled || 
            publicAccess.token !== token ||
            (publicAccess.expiresAt && new Date(publicAccess.expiresAt) < new Date())) {
          setError("Ce lien de partage a expiré ou n'est plus valide");
          return;
        }

        const formattedStory = formatStoryFromSupabase(storyData);
        setStory(formattedStory);
        
        await logAccess(storyId);
      } catch (err) {
        console.error("Erreur lors du chargement de l'histoire:", err);
        setError("Impossible de charger l'histoire");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedStory();
  }, [location.search, token]);

  const handleClose = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'histoire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-xl font-semibold mb-2 text-foreground">Histoire non disponible</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">
            Cette histoire n'est pas disponible ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  return <PublicStoryReader story={story} onClose={handleClose} />;
};

export default SharedStory;
