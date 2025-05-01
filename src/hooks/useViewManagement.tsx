
import { useState, useEffect } from "react";
import type { ViewType } from "@/types/views";

export const useViewManagement = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState<boolean>(false);
  
  // Vérifier la préférence de l'utilisateur concernant le guide au chargement
  useEffect(() => {
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
  }, []);

  return {
    currentView,
    setCurrentView,
    showGuide,
    setShowGuide,
  };
};
