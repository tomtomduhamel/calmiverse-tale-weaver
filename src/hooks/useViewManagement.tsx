
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ViewType } from "@/types/views";

export const useViewManagement = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Effet pour vérifier si le guide a déjà été vu
  useEffect(() => {
    try {
      const hasSeenGuide = localStorage.getItem("hasSeenGuide");
      if (!hasSeenGuide) {
        setShowGuide(true);
        localStorage.setItem("hasSeenGuide", "true");
      }
    } catch (err) {
      console.error("Error during guide initialization:", err);
    }
  }, []);

  // Effet pour réinitialiser la vue à "home" quand on navigue vers "/"
  useEffect(() => {
    console.log("Location changed:", location.pathname);
    if (location.pathname === "/") {
      console.log("Setting view to home");
      setCurrentView("home");
    }
  }, [location]);

  // Log lors des changements de vue
  useEffect(() => {
    console.log("Current view changed to:", currentView);
  }, [currentView]);

  return {
    currentView,
    setCurrentView,
    showGuide,
    setShowGuide
  };
};
