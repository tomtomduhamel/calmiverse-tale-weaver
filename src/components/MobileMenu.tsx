
import React from "react";
import { 
  Home, 
  Library, 
  Users, 
  Settings,
  PenSquare
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import type { ViewType } from "@/types/views";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";

/**
 * PHASE 2: MobileMenu simplifié - utilise uniquement useAppNavigation
 * Plus de props currentView/onViewChange - tout est géré par React Router
 */
const MobileMenu: React.FC = () => {
  const location = useLocation();
  const { navigateToHome, navigateToLibrary, navigateToCreate, navigateToProfiles, navigateToSettings } = useAppNavigation();
  const { totalActiveCount } = useBackgroundStoryGeneration();
  
  // Items for the bottom navigation
  const menuItems = [
    { icon: Home, title: "Accueil", path: "/", action: navigateToHome },
    { icon: Library, title: "Bibliothèque", path: "/library", action: navigateToLibrary },
    { icon: PenSquare, title: "Créer", path: "/create-story/step-1", action: navigateToCreate },
    { icon: Users, title: "Enfants", path: "/children", action: navigateToProfiles },
    { icon: Settings, title: "Paramètres", path: "/settings", action: navigateToSettings }
  ];

  const handleNavigation = (action: () => void, path: string) => {
    console.log("[MobileMenu] Navigation vers", path);
    action();
  };

  // Déterminer la route active en fonction du chemin actuel
  const isActive = (path: string): boolean => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md shadow-lg border-t border-border z-[100]">
      <div className="flex items-center justify-around h-14 px-1 pb-safe">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => handleNavigation(item.action, item.path)}
            className={cn(
              "flex flex-col items-center justify-center w-full p-1 rounded-lg transition-all duration-200 min-h-[44px]",
              isActive(item.path)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-label={item.title}
          >
            <div className="relative">
              <item.icon className="h-4 w-4" />
              {item.path === '/library' && totalActiveCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 text-[8px] bg-primary text-primary-foreground">
                  {totalActiveCount}
                </Badge>
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;
