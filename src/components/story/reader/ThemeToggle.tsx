
import React from 'react';
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  setIsDarkMode
}) => {
  return (
    <Button
      variant="outline"
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="w-10 h-10 transition-transform hover:scale-105"
      title={isDarkMode ? "Mode clair" : "Mode sombre"}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
};
