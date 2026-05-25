
import React from "react";
import {
  Home,
  Library,
  Users,
  Settings,
  PenSquare,
  Sparkles,
  CalendarClock
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
  const { navigateToHome, navigateToLibrary, navigateToCreate, navigateToDashboard, navigateToProfiles, navigateToSettings, navigateToRoutines } = useAppNavigation();
  const { totalActiveCount } = useBackgroundStoryGeneration();
  
  // Items for the bottom navigation
  const menuItems = [
    { icon: Home, title: "Accueil", path: "/", action: navigateToHome },
    { icon: Library, title: "Bibliothèque", path: "/library", action: navigateToLibrary },
    { icon: PenSquare, title: "Créer", path: "/create-story/step-1", action: navigateToCreate },
    { icon: Sparkles, title: "Mon ciel", path: "/dashboard", action: navigateToDashboard },
    { icon: Users, title: "Enfants", path: "/children", action: navigateToProfiles },
    { icon: CalendarClock, title: "Routines", path: "/routines", action: navigateToRoutines },
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-primary-soft/20 shadow-floating z-[100] pb-safe">
      <div className="flex items-center justify-around h-14 px-1">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.title}
              onClick={() => handleNavigation(item.action, item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center w-full p-1 rounded-xl transition-all duration-400 ease-calm min-h-[44px] active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground/70 hover:text-foreground"
              )}
              aria-label={item.title}
            >
              {active && (
                <span aria-hidden className="absolute top-0.5 h-1 w-1 rounded-full bg-primary-soft animate-glow-pulse" />
              )}
              <div className="relative">
                <item.icon className={cn("h-4 w-4 transition-transform duration-400 ease-calm", active && "scale-110")} strokeWidth={active ? 2.4 : 1.8} />
                {item.path === '/library' && totalActiveCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 text-[8px] bg-primary text-primary-foreground">
                    {totalActiveCount}
                  </Badge>
                )}
              </div>
              <span className={cn("text-[10px] mt-0.5 leading-tight transition-opacity", active ? "opacity-100 font-semibold" : "opacity-70")}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileMenu;
