
import React from 'react';
import { useStoryForm } from "@/contexts/story-form/StoryFormContext";
import StoryFormDebug from './StoryFormDebug';

interface AdvancedDebugPanelProps {
  onForceValidation?: () => void;
}

/**
 * Panneau de débogage avancé avec affichage complet de l'état
 * du formulaire et outils de diagnostic
 */
const AdvancedDebugPanel: React.FC<AdvancedDebugPanelProps> = ({ 
  onForceValidation 
}) => {
  const { state } = useStoryForm();
  const { debugInfo } = state;
  
  // N'afficher qu'en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <StoryFormDebug 
      debugInfo={debugInfo} 
      onForceValidation={onForceValidation}
    />
  );
};

export default AdvancedDebugPanel;
