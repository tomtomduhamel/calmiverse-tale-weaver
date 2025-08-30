import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import TitleSelectionStep from './TitleSelectionStep';
import MobileTitleSelectionStep from './mobile/MobileTitleSelectionStep';
import type { Child } from '@/types/child';

interface TitleSelectionStepWrapperProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
}

const TitleSelectionStepWrapper: React.FC<TitleSelectionStepWrapperProps> = ({ 
  children, 
  onStoryCreated 
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return <MobileTitleSelectionStep children={children} onStoryCreated={onStoryCreated} />;
  }

  return <TitleSelectionStep children={children} onStoryCreated={onStoryCreated} />;
};

export default TitleSelectionStepWrapper;