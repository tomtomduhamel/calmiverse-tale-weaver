
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ViewType } from '@/types/views';

export const useViewManagement = () => {
  const navigate = useNavigate();

  const setCurrentView = (view: ViewType) => {
    // Log pour le débogage
    console.log("[useViewManagement] DEBUG: Changement de vue vers", view);

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
    setCurrentView,
  };
};
