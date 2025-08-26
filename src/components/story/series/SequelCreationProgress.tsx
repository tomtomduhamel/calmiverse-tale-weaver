import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { CheckCircle, BookOpen, Settings, Sparkles } from 'lucide-react';

interface SequelCreationProgressProps {
  isCreating: boolean;
  onComplete?: () => void;
}

export const SequelCreationProgress: React.FC<SequelCreationProgressProps> = ({
  isCreating,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { 
      label: "Création de la suite...", 
      icon: BookOpen,
      duration: 2000 
    },
    { 
      label: "Configuration des paramètres...", 
      icon: Settings,
      duration: 1500 
    },
    { 
      label: "Génération en cours...", 
      icon: Sparkles,
      duration: 2000 
    },
    { 
      label: "Suite créée avec succès !", 
      icon: CheckCircle,
      duration: 1000 
    }
  ];

  useEffect(() => {
    if (!isCreating) {
      setProgress(0);
      setCurrentStep(0);
      setIsComplete(false);
      return;
    }

    let totalTime = 0;
    const stepTimers: NodeJS.Timeout[] = [];

    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        setProgress((index + 1) * 25);
        
        if (index === steps.length - 1) {
          setIsComplete(true);
          // Auto-close after showing success
          setTimeout(() => {
            onComplete?.();
          }, 1500);
        }
      }, totalTime);
      
      stepTimers.push(timer);
      totalTime += step.duration;
    });

    return () => {
      stepTimers.forEach(timer => clearTimeout(timer));
    };
  }, [isCreating, onComplete]);

  if (!isCreating) return null;

  const CurrentIcon = steps[currentStep]?.icon || BookOpen;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-full ${isComplete ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
          <CurrentIcon className={`w-6 h-6 ${!isComplete ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {steps[currentStep]?.label || "Préparation..."}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isComplete 
            ? "Votre suite sera bientôt disponible dans votre bibliothèque"
            : "Veuillez patienter pendant la création de votre suite"
          }
        </p>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className={`h-2 transition-all duration-500 ${isComplete ? 'bg-green-100' : ''}`} 
        />
        <div className="text-xs text-right text-muted-foreground">
          {Math.round(progress)}% complété
        </div>
      </div>

      {isComplete && (
        <div className="text-center pt-2">
          <p className="text-sm text-green-600 font-medium">
            ✓ Suite créée avec succès !
          </p>
        </div>
      )}
    </div>
  );
};