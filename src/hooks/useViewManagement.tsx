
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ViewType } from '@/types/views';

export const useViewManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentViewState] = useState<ViewType>(() => {
    // Initialiser la vue en fonction de l'URL actuelle (sans reader)
    if (location.pathname === "/settings") return "settings";
    if (location.pathname === "/children") return "profiles";
    if (location.pathname === "/library") return "library";
    if (location.pathname === "/create-story/step-1") return "create";
    return "home";
  });
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Synchroniser la vue avec l'URL (sans reader)
  useEffect(() => {
    console.log("[useViewManagement] Synchronisation avec l'URL", { 
      path: location.pathname, 
      currentLocation: location
    });

    if (location.pathname === "/") {
      setCurrentViewState("home");
    } else if (location.pathname === "/settings") {
      setCurrentViewState("settings");
    } else if (location.pathname === "/children") {
      setCurrentViewState("profiles");
    } else if (location.pathname === "/library") {
      setCurrentViewState("library");
    } else if (location.pathname === "/create-story/step-1") {
      setCurrentViewState("create");
    }
    
    // Vérifier si le guide doit être affiché
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
  }, [location]);

  // Fonction pour changer de vue (sans reader)
  const setCurrentView = useCallback((view: ViewType) => {
    console.log("[useViewManagement] Changement de vue vers", view);
    
    setCurrentViewState(view);

    // Navigation basée sur la vue (reader n'est plus géré ici)
    switch (view) {
      case "home":
        navigate("/");
        break;
      case "create":
        navigate("/create-story/step-1");
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
      // reader n'est plus géré ici - utiliser navigate("/reader/:id") directement
    }
  }, [navigate]);

  return {
    currentView,
    setCurrentView,
    showGuide
  };
};
