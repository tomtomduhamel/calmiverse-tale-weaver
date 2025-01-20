import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Story } from "@/types/story";
import StoryReader from "@/components/StoryReader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingStory from "@/components/LoadingStory";

const SharedStory = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const logAccess = async (storyId: string) => {
    try {
      const accessLog = {
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent,
        ipAddress: "GDPR compliant - not stored", // Pour la conformité RGPD
        referrer: document.referrer || "direct",
      };

      await addDoc(collection(db, `stories/${storyId}/accessLogs`), accessLog);
      console.log("Accès enregistré avec succès");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'accès:", error);
      // On ne montre pas d'erreur à l'utilisateur car ce n'est pas critique
    }
  };

  useEffect(() => {
    const fetchSharedStory = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const storyId = params.get("id");
        const token = params.get("token");

        if (!storyId || !token) {
          toast({
            title: "Erreur",
            description: "Lien de partage invalide",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        const storyRef = doc(db, "stories", storyId);
        const storyDoc = await getDoc(storyRef);

        if (!storyDoc.exists()) {
          toast({
            title: "Erreur",
            description: "Cette histoire n'existe pas",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        const storyData = storyDoc.data() as Story;
        
        // Vérifier si l'histoire est partagée publiquement et si le token correspond
        if (!storyData.sharing?.publicAccess?.enabled || 
            storyData.sharing.publicAccess.token !== token ||
            new Date(storyData.sharing.publicAccess.expiresAt) < new Date()) {
          toast({
            title: "Erreur",
            description: "Ce lien de partage a expiré ou n'est plus valide",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setStory({ ...storyData, id: storyDoc.id });
        
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
  }, [location.search, navigate, toast]);

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

export default SharedStory;