
import { useState, useEffect } from "react";
import { initializeObjectives } from "@/utils/initializeObjectives";

/**
 * Hook spécialisé pour gérer l'initialisation de l'application
 */
export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log("[useAppInitialization] DEBUG: Initializing application");
    
    try {
      initializeObjectives();
      setIsInitialized(true);
      console.log("[useAppInitialization] DEBUG: Initialization completed successfully");
    } catch (err) {
      console.error("Error during initialization:", err);
    }
  }, []);

  return { isInitialized };
};
