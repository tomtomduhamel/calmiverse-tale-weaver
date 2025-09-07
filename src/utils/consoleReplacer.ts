/**
 * Production-ready console.log replacement utility
 * Systematically replaces all console.log statements with proper logger calls
 */

import { logger } from '@/utils/logger';

export const replaceConsoleInComponent = (componentCode: string): string => {
  return componentCode
    // Replace basic console.log
    .replace(/console\.log\(/g, 'logger.debug(')
    // Replace console.warn
    .replace(/console\.warn\(/g, 'logger.warn(')
    // Replace console.error  
    .replace(/console\.error\(/g, 'logger.error(')
    // Replace console.info
    .replace(/console\.info\(/g, 'logger.info(');
};

// List of components that need console.log replacement
export const COMPONENTS_TO_UPDATE = [
  'src/components/ChildrenProfiles.tsx',
  'src/components/StoryForm.tsx', 
  'src/components/StoryLibrary.tsx',
  'src/components/home/HomeHero.tsx',
  'src/components/layout/ContentRouter.tsx',
  'src/components/library/StoryCard.tsx',
  'src/components/library/StoryGrid.tsx',
  'src/components/library/card/StoryCardActions.tsx',
  'src/components/library/series/SeriesStoryCard.tsx',
  'src/components/settings/KindleSection.tsx',
  'src/components/settings/ProfileSection.tsx',
  'src/components/story/AdvancedRecoveryPanel.tsx'
] as const;

export const HOOKS_TO_UPDATE = [
  'src/hooks/useStoryFormAuth.ts',
  'src/hooks/stories/useStoryUpdate.tsx'
] as const;