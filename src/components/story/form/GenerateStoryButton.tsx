import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const GenerateStoryButton: React.FC = () => {
  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground flex items-center justify-center gap-2 py-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all hover:scale-[1.02]"
    >
      <BookOpen className="w-5 h-5" />
      Générer l'histoire
    </Button>
  );
};

export default GenerateStoryButton;