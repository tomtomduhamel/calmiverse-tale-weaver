
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [open, setOpen] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = React.useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà choisi de ne plus afficher le guide
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    if (!hideGuide) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeGuide();
    }
  };

  const closeGuide = () => {
    setOpen(false);
    
    // Si l'option "ne plus afficher" est cochée, enregistrer la préférence
    if (doNotShowAgain) {
      localStorage.setItem('calmi-hide-guide', 'true');
    }
    
    toast({
      title: "Guide terminé !",
      description: "Vous pouvez maintenant créer votre première histoire.",
    });
  };

  const handleDoNotShowChange = (checked: boolean) => {
    setDoNotShowAgain(checked);
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
        
        <DialogFooter className="flex-col items-start gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="doNotShowAgain" 
              checked={doNotShowAgain} 
              onCheckedChange={handleDoNotShowChange} 
            />
            <label 
              htmlFor="doNotShowAgain" 
              className="text-sm font-medium cursor-pointer"
            >
              Ne plus afficher
            </label>
          </div>
          
          <div className="flex justify-between w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              onClick={closeGuide}
            >
              Passer le guide
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Terminer" : "Suivant"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
