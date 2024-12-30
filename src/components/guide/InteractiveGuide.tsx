import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Step {
  title: string;
  description: string;
  element?: string;
}

const steps: Step[] = [
  {
    title: "Bienvenue sur Calmi !",
    description: "Découvrez comment créer des histoires personnalisées pour vos enfants.",
  },
  {
    title: "Créer une histoire",
    description: "Cliquez sur le bouton 'Créer une histoire' pour commencer l'aventure.",
    element: "create-story-btn",
  },
  {
    title: "Bibliothèque",
    description: "Retrouvez toutes vos histoires dans la bibliothèque.",
    element: "library-btn",
  },
];

export const InteractiveGuide = () => {
  const [open, setOpen] = React.useState(true);
  const [currentStep, setCurrentStep] = React.useState(0);
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOpen(false);
      toast({
        title: "Guide terminé !",
        description: "Vous pouvez maintenant créer votre première histoire.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] animate-fade-in">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Passer le guide
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Terminer" : "Suivant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};