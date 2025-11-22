import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { CheckCircle, BookOpen, Settings, Sparkles, AlertTriangle } from 'lucide-react';
import { useSequelProgress } from '@/hooks/stories/useSequelProgress';

interface SequelCreationProgressProps {
  storyId: string | null;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const SequelCreationProgress: React.FC<SequelCreationProgressProps> = ({
  storyId,
  onComplete,
  onError
}) => {
  const progress = useSequelProgress(storyId);
  const [showSuccess, setShowSuccess] = useState(false);

  // Gérer la complétion
  useEffect(() => {
    if (progress.status === 'completed') {
      setShowSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    }
  }, [progress.status, onComplete]);

  // Gérer les erreurs
  useEffect(() => {
    if (progress.status === 'error') {
      onError?.(progress.message);
    }
  }, [progress.status, progress.message, onError]);

  if (!storyId) return null;

  // Sélectionner l'icône selon le statut réel
  const getIcon = () => {
    switch (progress.status) {
      case 'analyzing':
        return Settings;
      case 'generating':
        return Sparkles;
      case 'completed':
        return CheckCircle;
      case 'error':
        return AlertTriangle;
      default:
        return BookOpen;
    }
  };

  const Icon = getIcon();
  const isError = progress.status === 'error';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 rounded-full ${
          showSuccess 
            ? 'bg-green-100 text-green-600' 
            : isError
            ? 'bg-red-100 text-red-600'
            : 'bg-primary/10 text-primary'
        }`}>
          <Icon className={`w-6 h-6 ${
            !showSuccess && !isError ? 'animate-pulse' : ''
          }`} />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className={`text-lg font-semibold ${
          isError ? 'text-destructive' : 'text-foreground'
        }`}>
          {progress.message}
        </h3>
        <p className="text-sm text-muted-foreground">
          {showSuccess 
            ? "Votre suite est prête et disponible dans votre bibliothèque"
            : isError
            ? "Une erreur s'est produite lors de la génération"
            : progress.estimatedTimeRemaining
            ? `Temps restant estimé : ${Math.ceil(progress.estimatedTimeRemaining / 60)} min`
            : "Veuillez patienter pendant la création de votre suite"
          }
        </p>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progress.progress} 
          className={`h-2 transition-all duration-500 ${
            showSuccess ? '[&>div]:bg-green-500' : ''
          } ${
            isError ? '[&>div]:bg-destructive' : ''
          }`}
        />
        <div className="text-xs text-right text-muted-foreground">
          {Math.round(progress.progress)}% complété
        </div>
      </div>

      {showSuccess && (
        <div className="text-center pt-2">
          <p className="text-sm text-green-600 font-medium">
            ✓ Suite créée avec succès !
          </p>
        </div>
      )}

      {isError && (
        <div className="text-center pt-2">
          <p className="text-sm text-destructive font-medium">
            ✗ Échec de la génération
          </p>
        </div>
      )}
    </div>
  );
};