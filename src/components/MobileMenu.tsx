import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Library, Users } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

type ViewType = "home" | "library" | "profiles" | "settings" | "create" | "reader";

interface MobileMenuProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems = [
  { icon: Home, title: "Accueil", view: "home" as ViewType },
  { icon: Library, title: "Bibliothèque", view: "library" as ViewType },
  { icon: Users, title: "L'univers des enfants", view: "profiles" as ViewType },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ currentView, onViewChange }) => {
  const { setOpen, setOpenMobile } = useSidebar();
  const navigate = useNavigate();

  const handleNavigation = (view: ViewType) => {
    onViewChange(view);
    setOpenMobile(false);
    setOpen(false);
    if (view === "home") {
      navigate("/");
    }
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
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="flex items-center justify-start gap-2 w-full"
              onClick={() => handleNavigation(item.view)}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;