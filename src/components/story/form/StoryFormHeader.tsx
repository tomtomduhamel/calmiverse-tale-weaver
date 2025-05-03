
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface StoryFormHeaderProps {
  onModeSwitch: () => void;
}

const StoryFormHeader: React.FC<StoryFormHeaderProps> = ({ onModeSwitch }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-primary dark:text-primary-dark">
        Create a story
      </h2>
      <Button
        type="button"
        variant="outline"
        onClick={onModeSwitch}
        className="flex items-center gap-2"
      >
        <MessageCircle className="h-5 w-5" />
        Conversation mode
      </Button>
    </div>
  );
};

export default StoryFormHeader;
