import React from 'react';
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppTheme } from "@/hooks/useAppTheme";

interface ThemeToggleProps {
  showLabels?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'ghost' | 'default';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabels = false,
  size = 'default',
  variant = 'outline'
}) => {
  const { isDarkMode, theme, setLightMode, setDarkMode, setSystemMode } = useAppTheme();

  if (showLabels) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="min-w-0">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Basculer le thème</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50">
          <DropdownMenuItem onClick={() => setLightMode()}>
            <Sun className="mr-2 h-4 w-4" />
            Clair
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDarkMode(true)}>
            <Moon className="mr-2 h-4 w-4" />
            Sombre
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSystemMode()}>
            <Monitor className="mr-2 h-4 w-4" />
            Système
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setDarkMode(!isDarkMode)}
      className="transition-transform hover:scale-105"
      title={isDarkMode ? "Mode clair" : "Mode sombre"}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Basculer le thème</span>
    </Button>
  );
};

export default ThemeToggle;