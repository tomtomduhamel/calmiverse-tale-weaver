
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStoryViewProps {
  onBack: () => void;
}

export const EmptyStoryView: React.FC<EmptyStoryViewProps> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-50 min-h-screen p-4 flex items-center justify-center bg-background">
      <Card className="p-6 text-center animate-fade-in">
        <p className="mb-4">Aucune histoire à afficher</p>
        <Button onClick={onBack}>Retour</Button>
      </Card>
    </div>
  );
};
