
import React from "react";
import { 
  Home, 
  Library, 
  Users, 
  Settings,
  PenSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import type { ViewType } from "@/types/views";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";

interface MobileMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ currentView, onViewChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigateToHome, navigateToLibrary, navigateToCreate, navigateToProfiles, navigateToSettings } = useAppNavigation();
  
  // Items for the bottom navigation
  const menuItems = [
    { icon: Home, title: "Accueil", view: "home" as ViewType, action: navigateToHome },
    { icon: Library, title: "Bibliothèque", view: "library" as ViewType, action: navigateToLibrary },
    { icon: PenSquare, title: "Créer", view: "create" as ViewType, action: navigateToCreate },
    { icon: Users, title: "Enfants", view: "profiles" as ViewType, action: navigateToProfiles },
    { icon: Settings, title: "Paramètres", view: "settings" as ViewType, action: navigateToSettings }
  ];

  const handleNavigation = (view: ViewType, action: () => void) => {
    console.log("[MobileMenu] Navigation vers", { view, currentPath: location.pathname });
    action();
    onViewChange(view);
  };

  // Déterminer la vue active en fonction du chemin actuel
  const getActiveView = (): ViewType => {
    if (location.pathname === "/library") return "library";
    if (location.pathname === "/settings") return "settings";
    if (location.pathname === "/children") return "profiles";
    if (location.pathname.startsWith("/create-story")) return "create";
    if (location.pathname === "/") return "home";
    return currentView;
  };

  const activeView = getActiveView();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md shadow-lg border-t border-border z-[100]">
      <div className="flex items-center justify-around h-14 px-1 pb-safe">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => handleNavigation(item.view, item.action)}
            className={cn(
              "flex flex-col items-center justify-center w-full p-1 rounded-lg transition-all duration-200 min-h-[44px]",
              activeView === item.view
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-label={item.title}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[10px] mt-0.5 leading-tight">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;
