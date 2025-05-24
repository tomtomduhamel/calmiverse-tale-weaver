
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ViewType } from '@/types/views';

/**
 * Hook spécialisé pour gérer la navigation entre les différentes vues de l'application
 */
export const useViewManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentViewState] = useState<ViewType>(() => {
    // Initialiser la vue en fonction de l'URL actuelle
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') as ViewType | null;
    
    if (viewParam === "reader") return "reader";
    if (location.pathname === "/settings") return "settings";
    if (location.pathname === "/children") return "profiles";
    if (location.pathname === "/create-story-simple") return "create";
    if (location.pathname === "/app") return "library";
    return "home";
  });
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Synchroniser la vue avec l'URL au chargement et lors des changements d'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') as ViewType | null;
    
    console.log("[useViewManagement] DEBUG: Vue synchronisée avec l'URL", { 
      path: location.pathname, 
      search: location.search, 
      viewParam, 
      currentView: viewParam || (location.pathname === "/" ? "home" : 
                                location.pathname === "/settings" ? "settings" : 
                                location.pathname === "/children" ? "profiles" :
                                location.pathname === "/create-story-simple" ? "create" : 
                                location.pathname === "/app" ? "library" : "home")
    });

    if (viewParam === "reader") {
      setCurrentViewState("reader");
    } else if (location.pathname === "/") {
      setCurrentViewState("home");
    } else if (location.pathname === "/settings") {
      setCurrentViewState("settings");
    } else if (location.pathname === "/children") {
      setCurrentViewState("profiles");
    } else if (location.pathname === "/create-story-simple") {
      setCurrentViewState("create");
    } else if (location.pathname === "/app") {
      setCurrentViewState("library");
    }
    
    // Vérifier si le guide doit être affiché
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
  }, [location]);

  // Fonction pour changer de vue avec synchronisation de l'URL
  const setCurrentView = useCallback((view: ViewType) => {
    console.log("[useViewManagement] DEBUG: Changement de vue vers", view);
    
    // Toujours mettre à jour l'état local immédiatement
    setCurrentViewState(view);

    // Navigation basée sur la vue
    if (view === "home") {
      navigate("/");
    } else if (view === "create") {
      navigate("/create-story-simple");
    } else if (view === "profiles") {
      navigate("/children");
    } else if (view === "library") {
      navigate("/app");
    } else if (view === "settings") {
      navigate("/settings");
    } else if (view === "reader") {
      // Pour la vue reader, nous ajoutons un paramètre à l'URL actuelle
      // au lieu de naviguer vers une nouvelle page
      const currentPath = location.pathname;
      
      // Préserver le chemin actuel et ajouter le paramètre view
      if (currentPath === "/app") {
        navigate("/app?view=reader");
      } else if (currentPath === "/") {
        navigate("/?view=reader");
      } else {
        // Cas particulier: Si nous sommes déjà sur une autre page, il faut revenir à /app
        navigate("/app?view=reader");
      }
    }
  }, [navigate, location.pathname]);

  return {
    currentView,
    setCurrentView,
    showGuide
  };
};
