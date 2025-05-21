
import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ViewType } from '@/types/views';

export const useViewManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentViewState] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Déterminer la vue actuelle basée sur l'URL au chargement
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
    }
    
    // Vérifier si le guide doit être affiché
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
    
  }, [location]);

  const setCurrentView = (view: ViewType) => {
    // Log pour le débogage
    console.log("[useViewManagement] DEBUG: Changement de vue vers", view);
    setCurrentViewState(view);

    // Navigation logique basée sur la vue
    if (view === "home") {
      navigate("/");
    } else if (view === "create") {
      navigate("/?view=create");
    } else if (view === "profiles") {
      navigate("/?view=profiles");
    } else if (view === "library") {
      navigate("/?view=library");
    } else if (view === "reader") {
      navigate("/?view=reader");
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
