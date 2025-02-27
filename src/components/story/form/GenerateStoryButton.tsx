
import React from "react";
import { BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateStoryButtonProps {
  disabled?: boolean;
}

const GenerateStoryButton: React.FC<GenerateStoryButtonProps> = ({ disabled }) => {
  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-md flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
      disabled={disabled}
    >
      <BookMarked className="h-5 w-5" />
      <span className="font-medium">
        {disabled ? "Génération en cours..." : "Générer mon histoire"}
      </span>
    </Button>
  );
};

export default GenerateStoryButton;
