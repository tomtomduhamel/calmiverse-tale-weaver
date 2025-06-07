
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EmailShareForm from './share/EmailShareForm';
import KindleShareButton from './share/KindleShareButton';
import { RobustKindleProgressDialog } from '../kindle/RobustKindleProgressDialog';
import { useShareStory } from './share/useShareStory';

interface ShareStoryDialogProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoryDialog = ({ storyId, isOpen, onClose }: ShareStoryDialogProps) => {
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  
  const {
    email,
    setEmail,
    isLoading,
    uploadProgress,
    handleEmailShare,
    handleKindleShare,
    retryKindleShare,
    resetProgress
  } = useShareStory(storyId, onClose);

  const handleKindleClick = async () => {
    setShowProgressDialog(true);
    await handleKindleShare();
  };

  const handleProgressDialogClose = () => {
    setShowProgressDialog(false);
    resetProgress();
    
    // Si l'upload est terminé avec succès, fermer aussi le dialog principal
    if (uploadProgress?.step === 'completed') {
      onClose();
    }
  };

  const handleRetry = async () => {
    await retryKindleShare();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Partager l'histoire</DialogTitle>
            <DialogDescription>
              Choisissez comment vous souhaitez partager cette histoire
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <EmailShareForm
              email={email}
              isLoading={isLoading}
              onEmailChange={setEmail}
              onSubmit={handleEmailShare}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            <KindleShareButton
              isLoading={isLoading}
              onClick={handleKindleClick}
            />
          </div>
        </DialogContent>
      </Dialog>

      <RobustKindleProgressDialog
        isOpen={showProgressDialog}
        onClose={handleProgressDialogClose}
        progress={uploadProgress}
        onRetry={handleRetry}
      />
    </>
  );
};
