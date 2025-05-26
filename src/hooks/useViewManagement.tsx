
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ViewType } from '@/types/views';

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
    if (location.pathname === "/library") return "library";
    if (location.pathname === "/create-story-n8n") return "create";
    return "home";
  });
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Synchroniser la vue avec l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') as ViewType | null;
    
    console.log("[useViewManagement] Synchronisation avec l'URL", { 
      path: location.pathname, 
      search: location.search, 
      viewParam,
      currentLocation: location
    });

    if (viewParam === "reader") {
      console.log("[useViewManagement] Vue reader détectée dans l'URL");
      setCurrentViewState("reader");
    } else if (location.pathname === "/") {
      setCurrentViewState("home");
    } else if (location.pathname === "/settings") {
      setCurrentViewState("settings");
    } else if (location.pathname === "/children") {
      setCurrentViewState("profiles");
    } else if (location.pathname === "/library") {
      setCurrentViewState("library");
    } else if (location.pathname === "/create-story-n8n") {
      setCurrentViewState("create");
    }
    
    // Vérifier si le guide doit être affiché
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
  }, [location]);

  // Fonction pour changer de vue avec navigation simplifiée
  const setCurrentView = useCallback((view: ViewType) => {
    console.log("[useViewManagement] Changement de vue vers", view);
    
    setCurrentViewState(view);

    // Navigation basée sur la vue
    switch (view) {
      case "home":
        navigate("/");
        break;
      case "create":
        navigate("/create-story-n8n");
        break;
      case "profiles":
        navigate("/children");
        break;
      case "library":
        navigate("/library");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "reader":
        // Pour la vue reader, ajouter un paramètre à l'URL actuelle
        const currentPath = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('view', 'reader');
        const newUrl = `${currentPath}?${searchParams.toString()}`;
        console.log("[useViewManagement] Navigation vers reader:", newUrl);
        navigate(newUrl);
        break;
    }
  }, [navigate, location.pathname, location.search]);

  return {
    currentView,
    setCurrentView,
    showGuide
  };
};
