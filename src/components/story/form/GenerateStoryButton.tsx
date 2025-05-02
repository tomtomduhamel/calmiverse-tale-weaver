
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateStoryButtonProps {
  disabled?: boolean;
  className?: string;
}

const GenerateStoryButton: React.FC<GenerateStoryButtonProps> = ({ 
  disabled = false,
  className
}) => {
  return (
    <Button
      type="submit"
      className={cn(
        "w-full py-6 text-lg flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white",
        disabled ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.01] transition-transform",
        className
      )}
      disabled={disabled}
    >
      <Sparkles className="w-5 h-5" />
      Générer l'histoire
    </Button>
  );
};

export default GenerateStoryButton;
