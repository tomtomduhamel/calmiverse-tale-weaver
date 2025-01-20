import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EmailShareForm from './share/EmailShareForm';
import KindleShareButton from './share/KindleShareButton';
import { useShareStory } from './share/useShareStory';

interface ShareStoryDialogProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoryDialog = ({ storyId, isOpen, onClose }: ShareStoryDialogProps) => {
  const {
    email,
    setEmail,
    isLoading,
    handleEmailShare,
    handleKindleShare
  } = useShareStory(storyId, onClose);

  return (
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
            onClick={handleKindleShare}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};