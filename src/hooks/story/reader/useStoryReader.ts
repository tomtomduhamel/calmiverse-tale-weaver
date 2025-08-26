
import { useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useControlsVisibility } from './useControlsVisibility';
import { useAutoScroll } from '../useAutoScroll';
import { useMarkAsRead } from '../useMarkAsRead';
import { useStoryReaderState } from './useStoryReaderState';
import { useStoryReaderActions } from './useStoryReaderActions';
import type { Story } from '@/types/story';

interface UseStoryReaderProps {
  story: Story | null;
  onClose?: () => void;
  onBack?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
}

export const useStoryReader = ({
  story: initialStory,
  onClose,
  onBack,
  onToggleFavorite,
  onMarkAsRead
}: UseStoryReaderProps) => {
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // State management
  const storyState = useStoryReaderState({ initialStory });

  // Gestion de la visibilité des contrôles (100% manuel)
  const {
    isVisible: controlsVisible,
    toggleVisibility: toggleControls
  } = useControlsVisibility({
    persistState: true
  });

  // Calcul des métriques pour le défilement automatique
  const wordCount = storyState.story?.content?.trim().split(/\s+/).length || 0;
  
  // Gestion du défilement automatique
  const autoScrollState = useAutoScroll({ 
    wordCount, 
    scrollAreaRef,
  });
  
  // Gestion du marquage comme lu
  const { isUpdatingReadStatus, handleMarkAsRead } = useMarkAsRead({
    story: storyState.story,
    onMarkAsRead,
    setStory: storyState.setStory
  });

  // Actions
  const actions = useStoryReaderActions({
    story: storyState.story,
    setStory: storyState.setStory,
    setIsUpdatingFavorite: storyState.setIsUpdatingFavorite,
    onBack,
    onClose,
    onToggleFavorite,
    stopAutoScroll: autoScrollState.stopAutoScroll
  });

  // Effets de cycle de vie
  useEffect(() => {
    console.log("[StoryReader] DEBUG: Lecteur d'histoire affiché pour:", storyState.story?.id);
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log("[StoryReader] DEBUG: Lecteur d'histoire fermé");
      document.body.style.overflow = '';
    };
  }, [storyState.story?.id]);

  return {
    // State
    ...storyState,
    isMobile,
    scrollAreaRef,
    controlsVisible,
    toggleControls,
    isUpdatingReadStatus,
    
    // Auto scroll state
    ...autoScrollState,
    
    // Actions
    ...actions,
    handleMarkAsRead
  };
};
