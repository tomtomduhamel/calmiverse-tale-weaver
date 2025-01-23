import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCcw, HelpCircle } from "lucide-react";

interface ChatHeaderProps {
  onSwitchMode: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onSwitchMode }) => {
  return (
    <div className="p-4 border-b border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-secondary">Création d'histoire</h2>
          <p className="text-sm text-muted-foreground">Définissons ensemble votre histoire</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onSwitchMode}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5" />
            Mode classique
          </Button>
          <Button variant="ghost" size="icon" aria-label="Réinitialiser">
            <RefreshCcw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Aide">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;