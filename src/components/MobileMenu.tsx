
import React from "react";
import { 
  Home, 
  Library, 
  Users, 
  Settings,
  PenSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import type { ViewType } from "@/types/views";

interface MobileMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ currentView, onViewChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Items for the bottom navigation
  const menuItems = [
    { icon: Home, title: "Accueil", view: "home" as ViewType, path: "/" },
    { icon: Library, title: "Bibliothèque", view: "library" as ViewType, path: "/app" },
    { icon: PenSquare, title: "Créer", view: "create" as ViewType, path: "/create-story-simple" },
    { icon: Users, title: "Profils", view: "profiles" as ViewType, path: "/profiles" },
    { icon: Settings, title: "Paramètres", view: "settings" as ViewType, path: "/settings" }
  ];

  const handleNavigation = (view: ViewType, path: string) => {
    // Pour la page d'accueil et la bibliothèque, on peut changer la vue directement si on est déjà sur /app ou /
    if ((path === "/" || path === "/app") && (location.pathname === "/" || location.pathname === "/app")) {
      onViewChange(view);
    } else {
      // Dans les autres cas, on navigue vers la page correspondante
      navigate(path);
      
      // On met à jour la vue si nécessaire (pour la cohérence de l'interface)
      if (path === "/") {
        onViewChange("home");
      } else if (path === "/app") {
        onViewChange("library");
      } else if (path === "/settings") {
        onViewChange("settings");
      } else if (path === "/profiles") {
        onViewChange("profiles");
      } else if (path === "/create-story-simple") {
        onViewChange("create");
      }
    }
  };

  // Déterminer la vue active en fonction du chemin actuel si la vue n'est pas déjà correctement définie
  React.useEffect(() => {
    if (location.pathname === "/settings" && currentView !== "settings") {
      onViewChange("settings");
    } else if (location.pathname === "/profiles" && currentView !== "profiles") {
      onViewChange("profiles");
    } else if (location.pathname === "/create-story-simple" && currentView !== "create") {
      onViewChange("create");
    }
  }, [location.pathname, currentView, onViewChange]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background shadow-lg border-t border-border rounded-t-xl z-60">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => handleNavigation(item.view, item.path)}
            className={cn(
              "flex flex-col items-center justify-center w-full p-1 rounded-md transition-colors",
              (currentView === item.view || (location.pathname === item.path))
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.title}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;
