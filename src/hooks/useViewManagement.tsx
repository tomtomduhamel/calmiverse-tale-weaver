
import { useState, useEffect } from 'react';
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
    if (location.pathname === "/profiles") return "profiles";
    if (location.pathname === "/create-story-simple") return "create";
    if (location.pathname === "/app") return "library";
    return "home";
  });
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Synchroniser la vue avec l'URL au chargement et lors des changements d'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') as ViewType | null;
    
    if (location.pathname === "/") {
      if (viewParam && ["create", "profiles", "library", "reader"].includes(viewParam)) {
        setCurrentViewState(viewParam as ViewType);
      } else {
        setCurrentViewState("home");
      }
    } else if (location.pathname === "/settings") {
      setCurrentViewState("settings");
    } else if (location.pathname === "/profiles") {
      setCurrentViewState("profiles");
    } else if (location.pathname === "/create-story-simple") {
      setCurrentViewState("create");
    } else if (location.pathname === "/app") {
      setCurrentViewState("library");
    }
    
    // Vérifier si le guide doit être affiché
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
    
    console.log("[useViewManagement] DEBUG: Vue synchronisée avec l'URL", { 
      path: location.pathname, 
      search: location.search, 
      viewParam, 
      currentView: viewParam || (location.pathname === "/" ? "home" : 
                               location.pathname === "/settings" ? "settings" : 
                               location.pathname === "/profiles" ? "profiles" :
                               location.pathname === "/create-story-simple" ? "create" : 
                               location.pathname === "/app" ? "library" : "home")
    });
    
  }, [location]);

  // Fonction pour changer de vue avec synchronisation de l'URL
  const setCurrentView = (view: ViewType) => {
    console.log("[useViewManagement] DEBUG: Changement de vue vers", view);
    setCurrentViewState(view);

    // Navigation basée sur la vue
    if (view === "home") {
      navigate("/");
    } else if (view === "create") {
      navigate("/create-story-simple");
    } else if (view === "profiles") {
      navigate("/profiles");
    } else if (view === "library") {
      navigate("/app");
    } else if (view === "reader") {
      // Pour la vue reader, nous ajoutons un paramètre à l'URL actuelle
      // au lieu de naviguer vers une nouvelle page
      const currentPath = location.pathname === "/" ? "/" : location.pathname;
      
      if (currentPath === "/") {
        navigate("/?view=reader");
      } else {
        // Préserver le chemin actuel et ajouter le paramètre view
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'reader');
        navigate(url.pathname + url.search);
      }
    } else if (view === "settings") {
      navigate("/settings");
    }
  };

  return {
    currentView,
    setCurrentView,
    showGuide
  };
};
