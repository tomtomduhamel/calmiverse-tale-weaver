import React from 'react';
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface SimpleThemeToggleProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'ghost' | 'default';
}

export const SimpleThemeToggle: React.FC<SimpleThemeToggleProps> = ({
  size = 'sm',
  variant = 'ghost'
}) => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className="transition-transform hover:scale-105"
      title={theme === 'dark' ? "Mode clair" : "Mode sombre"}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Basculer le thème</span>
    </Button>
  );
};

export default SimpleThemeToggle;