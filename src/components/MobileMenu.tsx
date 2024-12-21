import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Library, Users } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

type ViewType = "home" | "library" | "profiles" | "settings" | "create" | "reader";

interface MobileMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ currentView, onViewChange }) => {
  const { setOpen, setOpenMobile } = useSidebar();

  const handleNavigation = (view: ViewType) => {
    onViewChange(view);
    setOpenMobile(false);
    setOpen(false);
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
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;