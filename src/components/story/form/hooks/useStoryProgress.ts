
import { useState, useEffect } from "react";

export const useStoryProgress = (isSubmitting: boolean) => {
  const [progress, setProgress] = useState(0);

  // Simulate progress for a better user experience
  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 5;
          const newValue = prev + increment;
          return newValue >= 95 ? 95 : newValue;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (progress !== 0 && progress !== 100) {
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [isSubmitting, progress]);

  return { progress };
};
