import { useState } from 'react';
import type { ConversationStep, StoryDetails } from '@/types/conversation';
import type { ChatMessage } from '@/types/chat';

export const useStoryChat = () => {
  const [currentStep, setCurrentStep] = useState<ConversationStep>("welcome");
  const [storyDetails, setStoryDetails] = useState<StoryDetails>({
    targetAudience: []
  });

  const getNextPrompt = (step: ConversationStep, userMessage: string): string => {
    switch (step) {
      case "welcome":
        return "Pour commencer, dis-moi pour qui tu souhaites créer cette histoire ? Tu peux mentionner un ou plusieurs enfants.";
      case "target_audience":
        return "Super ! Maintenant, parlons de l'univers dans lequel se déroulera notre histoire. As-tu une préférence ?";
      default:
        return "Je ne comprends pas. Pourrais-tu reformuler ?";
    }
  };

  const processUserMessage = (message: string): ChatMessage => {
    let response: string;
    
    switch (currentStep) {
      case "welcome":
        // Extraire les noms mentionnés dans le message
        const names = message
          .split(/[,\s]+/)
          .filter(word => word.length > 1)
          .map(name => name.trim());
        
        if (names.length > 0) {
          setStoryDetails(prev => ({
            ...prev,
            targetAudience: names
          }));
          setCurrentStep("target_audience");
          response = getNextPrompt("target_audience", message);
        } else {
          response = "Je n'ai pas bien compris les noms. Peux-tu me les redonner ?";
        }
        break;
      
      default:
        response = "Je ne suis pas sûr de comprendre. Peux-tu reformuler ?";
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      timestamp: new Date()
    };
  };

  return {
    currentStep,
    storyDetails,
    processUserMessage,
    getNextPrompt
  };
};