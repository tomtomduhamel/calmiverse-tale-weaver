
import { useState } from "react";
import type { ViewType } from "@/types/views";

export const useViewManagement = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState<boolean>(true);

  return {
    currentView,
    setCurrentView,
    showGuide,
    setShowGuide,
  };
};
