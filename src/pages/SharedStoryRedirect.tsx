import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Composant de redirection pour les anciens liens de partage
 * Redirige /shared-story?id=xxx&token=yyy vers /shared/yyy?id=xxx
 */
const SharedStoryRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const storyId = params.get("id");
    const token = params.get("token");

    if (token && storyId) {
      // Rediriger vers le nouveau format d'URL
      navigate(`/shared/${token}?id=${storyId}`, { replace: true });
    } else {
      // Paramètres manquants, rediriger vers l'accueil
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default SharedStoryRedirect;
