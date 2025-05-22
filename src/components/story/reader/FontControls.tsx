
import React from 'react';
import { Button } from "@/components/ui/button";

interface FontControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDarkMode: boolean;
}

export const FontControls: React.FC<FontControlsProps> = ({
  fontSize,
  setFontSize,
  isDarkMode
}) => {
  const handleDecreaseFontSize = () => {
    const newSize = Math.max(12, fontSize - 2);
    setFontSize(newSize);
  };

  const handleIncreaseFontSize = () => {
    const newSize = Math.min(24, fontSize + 2);
    setFontSize(newSize);
  };

  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <>
      <Button
        variant="outline"
        onClick={handleDecreaseFontSize}
        className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      >
        A-
      </Button>
      <Button
        variant="outline"
        onClick={handleIncreaseFontSize}
        className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      >
        A+
      </Button>
    </>
  );
};
