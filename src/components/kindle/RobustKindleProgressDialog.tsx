import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
interface RobustUploadProgress {
  step: 'validating' | 'generating' | 'uploading' | 'sending' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: string;
  bucketUsed?: string;
}
interface RobustKindleProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progress: RobustUploadProgress | null;
  onRetry?: () => void;
}
export const RobustKindleProgressDialog: React.FC<RobustKindleProgressDialogProps> = ({
  isOpen,
  onClose,
  progress,
  onRetry
}) => {
  const getStepIcon = () => {
    if (!progress) return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    switch (progress.step) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };
  const getStepDescription = (step: string) => {
    const descriptions = {
      validating: 'Vérification des données et paramètres utilisateur',
      generating: 'Création du fichier EPUB côté client avec JSZip',
      uploading: 'Envoi vers le stockage sécurisé avec système de fallback',
      sending: 'Transmission vers votre appareil Kindle',
      completed: 'Envoi terminé avec succès',
      error: 'Une erreur est survenue lors du processus'
    };
    return descriptions[step as keyof typeof descriptions] || step;
  };
  const isCompleted = progress?.step === 'completed';
  const hasError = progress?.step === 'error';
  const canRetry = hasError && onRetry;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon()}
            {isCompleted ? 'EPUB envoyé avec succès!' : hasError ? 'Erreur d\'envoi' : 'Envoi vers Kindle...'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {progress && <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>{progress.message}</span>
                  <span>{progress.progress}%</span>
                </div>
                
                <Progress value={progress.progress} className="h-2" />
                
                
                
                {progress.details && <div className="text-xs text-muted-foreground bg-muted/50 dark:bg-muted p-3 rounded-md border border-border">
                    {progress.details}
                  </div>}

                {progress.bucketUsed}
              </div>

              {hasError && <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.details || progress.message}
                  </AlertDescription>
                </Alert>}

              {isCompleted}
            </>}

          <div className="flex justify-end gap-2">
            {canRetry && <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>}
            
            <Button onClick={onClose} variant={isCompleted ? "default" : "secondary"} disabled={!isCompleted && !hasError}>
              {isCompleted ? 'Fermer' : hasError ? 'Fermer' : 'Annuler'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};