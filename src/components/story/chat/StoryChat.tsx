import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from 'firebase/functions';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ChatHeader from './ChatHeader';
import { useStoryChat } from '@/hooks/useStoryChat';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface StoryChatProps {
  onSwitchMode: () => void;
  selectedChild?: {
    name: string;
    age?: number;
    teddyName?: string;
  };
}

interface StoryResponse {
  story_text: string;
  story_summary: string;
  id_stories: string;
  status: 'pending' | 'completed' | 'read';
  createdAt: Date;
  title: string;
  preview: string;
}

interface GenerateStoryParams {
  prompt: string;
  objective?: string;
  childrenNames?: string[];
}

interface CloudFunctionResponse {
  data: StoryResponse;
}

const StoryChat: React.FC<StoryChatProps> = ({ onSwitchMode, selectedChild }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { processUserMessage } = useStoryChat();
  const { toast } = useToast();
  const functions = getFunctions();
  const generateStory = httpsCallable<GenerateStoryParams, CloudFunctionResponse>(
    functions, 
    'generateStory'
  );

  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: '1',
      type: 'ai',
      content: selectedChild 
        ? `Bonjour ! Je suis Calmi, et je vais t'aider à créer une belle histoire pour ${selectedChild.name}. Dis-moi quel genre d'histoire tu aimerais créer ?`
        : "Bonjour ! Je suis Calmi, et je vais t'aider à créer une belle histoire pour enfants. Pour commencer, dis-moi pour qui tu souhaites créer cette histoire ?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [selectedChild]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const prompt = selectedChild 
        ? `Crée une histoire pour ${selectedChild.name}${selectedChild.teddyName ? ` qui a un doudou nommé ${selectedChild.teddyName}` : ''}. Contexte de la conversation : ${userMessage.content}`
        : userMessage.content;

      const result = await generateStory({ 
        prompt,
        childrenNames: selectedChild ? [selectedChild.name] : undefined
      });
      
      if (result.data) {
        const aiResponse: ChatMessageType = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: result.data.story_text,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'histoire:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération de l'histoire. Veuillez réessayer.",
        variant: "destructive",
      });

      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: "Désolé, je n'ai pas pu générer l'histoire. Pourrions-nous réessayer ?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-soft-lg border border-primary/20">
      <ChatHeader onSwitchMode={onSwitchMode} />

      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isGenerating && <TypingIndicator />}
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-primary/20">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Écris ta réponse ici..."
            className="flex-1 bg-transparent border-primary/20 focus:border-primary"
            disabled={isGenerating}
          />
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90"
            disabled={isGenerating || !inputValue.trim()}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StoryChat;