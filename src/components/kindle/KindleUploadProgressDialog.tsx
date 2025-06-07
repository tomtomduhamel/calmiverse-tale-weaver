
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadProgress {
  step: 'connecting' | 'uploading' | 'processing' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  attempt?: number;
  maxAttempts?: number;
}

interface KindleUploadProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UploadProgress | null;
  onRetry?: () => void;
  canRetry?: boolean;
}

export const KindleUploadProgressDialog: React.FC<KindleUploadProgressDialogProps> = ({
  isOpen,
  onClose,
  progress,
  onRetry,
  canRetry = false
}) => {
  const getStepIcon = () => {
    if (!progress) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    switch (progress.step) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getProgressColor = () => {
    if (!progress) return '';
    
    switch (progress.step) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const isCompleted = progress?.step === 'completed';
  const hasError = progress?.step === 'error';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon()}
            {isCompleted ? 'EPUB envoyé avec succès!' : hasError ? 'Erreur d\'envoi' : 'Envoi vers Kindle en cours...'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {progress && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progress.message}</span>
                  <span>{progress.progress}%</span>
                </div>
                <Progress 
                  value={progress.progress} 
                  className="h-2"
                />
              </div>

              {progress.attempt && progress.maxAttempts && (
                <div className="text-xs text-muted-foreground text-center">
                  Tentative {progress.attempt} sur {progress.maxAttempts}
                </div>
              )}

              {hasError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.message}
                  </AlertDescription>
                </Alert>
              )}

              {isCompleted && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Votre histoire a été convertie en EPUB et envoyée vers votre Kindle. 
                    Vérifiez votre appareil dans quelques minutes.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            {hasError && canRetry && onRetry && (
              <Button onClick={onRetry} variant="outline">
                Réessayer
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant={isCompleted ? "default" : "secondary"}
              disabled={!isCompleted && !hasError}
            >
              {isCompleted ? 'Fermer' : hasError ? 'Fermer' : 'Annuler'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
