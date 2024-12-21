import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Library, Users, Settings } from "lucide-react";

type ViewType = "home" | "library" | "profiles" | "settings" | "create" | "reader";

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems = [
  { icon: Home, title: "Accueil", view: "home" as ViewType },
  { icon: Library, title: "Bibliothèque", view: "library" as ViewType },
  { icon: Users, title: "Profils enfants", view: "profiles" as ViewType },
  { icon: Settings, title: "Paramètres", view: "settings" as ViewType },
];

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const sidebar = useSidebar();

  const handleMenuClick = (view: ViewType) => {
    onViewChange(view);
    // Force la fermeture de la sidebar sur mobile et desktop
    if (sidebar) {
      sidebar.setOpenMobile(false);
      sidebar.setOpen(false);
    }
    // Ajout d'un petit délai pour s'assurer que l'état est bien mis à jour
    setTimeout(() => {
      if (sidebar) {
        sidebar.setOpenMobile(false);
        sidebar.setOpen(false);
      }
    }, 100);
  };

  return (
    <Sidebar className="bg-white/80 dark:bg-muted-dark/80 backdrop-blur-sm rounded-r-xl shadow-soft">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-secondary dark:text-white">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick(item.view)}
                    className={`transition-all hover:scale-105 ${
                      currentView === item.view
                        ? "bg-primary/20 dark:bg-primary-dark/20"
                        : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}