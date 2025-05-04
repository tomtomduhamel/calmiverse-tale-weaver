
import React from 'react';

interface StoryFormDebugInfoProps {
  formDebugInfo: any;
  isMobile: boolean;
}

const StoryFormDebugInfo: React.FC<StoryFormDebugInfoProps> = ({ formDebugInfo, isMobile }) => {
  if (process.env.NODE_ENV !== 'development' || isMobile) {
    return null;
  }
  
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 mb-4 rounded-lg text-xs">
      <h3 className="font-bold mb-1">Debug Information (dev only)</h3>
      <pre>{JSON.stringify(formDebugInfo, null, 2)}</pre>
    </div>
  );
};

export default React.memo(StoryFormDebugInfo);
