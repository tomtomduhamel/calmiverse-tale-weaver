
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
    { icon: Library, title: "Bibliothèque", view: "library" as ViewType, path: "/library" },
    { icon: PenSquare, title: "Créer", view: "create" as ViewType, path: "/create-story-titles" },
    { icon: Users, title: "Profils", view: "profiles" as ViewType, path: "/children" },
    { icon: Settings, title: "Paramètres", view: "settings" as ViewType, path: "/settings" }
  ];

  const handleNavigation = (view: ViewType, path: string) => {
    console.log("[MobileMenu] Navigation vers", { view, path });
    navigate(path);
    onViewChange(view);
  };

  // Déterminer la vue active en fonction du chemin actuel
  const getActiveView = (): ViewType => {
    if (location.pathname === "/library") return "library";
    if (location.pathname === "/settings") return "settings";
    if (location.pathname === "/children") return "profiles";
    if (location.pathname === "/create-story-titles") return "create";
    if (location.pathname === "/") return "home";
    return currentView;
  };

  const activeView = getActiveView();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background shadow-lg border-t border-border rounded-t-xl z-[100]">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => handleNavigation(item.view, item.path)}
            className={cn(
              "flex flex-col items-center justify-center w-full p-1 rounded-md transition-colors",
              activeView === item.view
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
