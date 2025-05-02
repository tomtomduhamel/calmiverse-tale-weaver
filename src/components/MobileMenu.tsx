
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Library, Users, Settings } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

type ViewType = "home" | "library" | "profiles" | "settings" | "create" | "reader";

interface MobileMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems = [
  { icon: Home, title: "Accueil", view: "home" as ViewType },
  { icon: Library, title: "Bibliothèque", view: "library" as ViewType },
  { icon: Users, title: "L'univers des enfants", view: "profiles" as ViewType },
  { icon: Settings, title: "Paramètres", view: "settings" as ViewType },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ currentView, onViewChange }) => {
  const { setOpen, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  // Si on n'est pas sur mobile, ne pas rendre le menu
  if (!isMobile) {
    return null;
  }

  const handleNavigation = (view: ViewType) => {
    onViewChange(view);
    setOpenMobile(false);
    setOpen(false);
    setIsOpen(false);
    if (view === "home") {
      navigate("/");
    } else if (view === "profiles") {
      navigate("/profiles");
    } else if (view === "settings") {
      navigate("/settings");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden fixed bottom-4 right-4 z-50 bg-primary text-white shadow-lg rounded-full h-12 w-12 flex items-center justify-center">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-xl bg-white/95 backdrop-blur-sm">
        <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-6 mt-2" />
        <nav className="flex flex-col space-y-4 px-2">
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant={currentView === item.view ? "default" : "ghost"}
              className="flex items-center justify-start gap-3 w-full h-14 text-lg"
              onClick={() => handleNavigation(item.view)}
            >
              <item.icon className="h-6 w-6" />
              {item.title}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
