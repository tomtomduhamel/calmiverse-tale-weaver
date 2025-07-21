
import { useState } from 'react';

export const useShareDialog = () => {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const openShareDialog = () => setShowShareDialog(true);
  const closeShareDialog = () => setShowShareDialog(false);

  return {
    showShareDialog,
    openShareDialog,
    closeShareDialog
  };
};
