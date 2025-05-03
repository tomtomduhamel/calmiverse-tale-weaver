
import { useState, useEffect } from "react";

export const useStoryProgress = (isSubmitting: boolean) => {
  const [progress, setProgress] = useState(0);

  // Simulate progress for a better user experience
  useEffect(() => {
    if (isSubmitting) {
      // Reset progress at the beginning of submission
      setProgress(0);
      
      // Start progress simulation
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Calculate random increment between 1-5%
          const increment = Math.random() * 5;
          // Calculate new value but cap at 95%
          const newValue = prev + increment;
          // Don't exceed 95% until we're finished
          return newValue >= 95 ? 95 : newValue;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (progress !== 0 && progress !== 100) {
      // If submission is complete but progress isn't, finish to 100%
      setProgress(100);
      // Reset progress after animation completes
      const timeout = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isSubmitting, progress]);

  return { progress };
};
