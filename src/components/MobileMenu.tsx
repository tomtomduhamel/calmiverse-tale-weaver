import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Library, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileMenuProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ currentView, onViewChange }) => {
  const navigate = useNavigate();

  const handleNavigation = (view: string) => {
    onViewChange(view);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px] bg-white/95 backdrop-blur-sm">
        <nav className="flex flex-col space-y-4 mt-8">
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 w-full"
            onClick={() => handleNavigation("home")}
          >
            <Home className="h-5 w-5" />
            Accueil
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 w-full"
            onClick={() => handleNavigation("library")}
          >
            <Library className="h-5 w-5" />
            Bibliothèque
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 w-full"
            onClick={() => handleNavigation("profiles")}
          >
            <Users className="h-5 w-5" />
            Enfants
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-2 w-full"
            onClick={() => handleNavigation("settings")}
          >
            <Settings className="h-5 w-5" />
            Paramètres
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;