
import React from 'react';
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  setIsDarkMode
}) => {
  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <Button
      variant="outline"
      onClick={() => setIsDarkMode(!isDarkMode)}
      className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      title={isDarkMode ? "Mode clair" : "Mode sombre"}
    >
      {isDarkMode ? "☀️" : "🌙"}
    </Button>
  );
};
