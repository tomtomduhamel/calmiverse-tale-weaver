
import React from 'react';

interface StoryFormLoadingProps {
  loadingType: 'auth' | 'objectives' | 'story';
}

const StoryFormLoading: React.FC<StoryFormLoadingProps> = ({ loadingType }) => {
  let message = "Loading...";
  
  switch (loadingType) {
    case 'auth':
      message = "Verifying authentication...";
      break;
    case 'objectives':
      message = "Loading objectives...";
      break;
    case 'story':
      // This is handled by LoadingStory component elsewhere
      break;
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-primary">{message}</div>
    </div>
  );
};

export default React.memo(StoryFormLoading);
