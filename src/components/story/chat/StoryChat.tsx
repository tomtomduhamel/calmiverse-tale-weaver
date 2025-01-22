import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, RefreshCcw, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

const StoryChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Message de bienvenue initial
    const welcomeMessage: ChatMessageType = {
      id: '1',
      type: 'ai',
      content: "Bonjour ! Je vais vous aider à créer une histoire personnalisée. Pour commencer, quel type d'histoire souhaitez-vous créer ?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    // Scroll automatique vers le bas lors de nouveaux messages
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simuler une réponse de l'IA (à remplacer par l'appel API réel)
    setTimeout(() => {
      const aiResponse: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Je comprends votre choix. Maintenant, parlons du personnage principal. Quel nom souhaitez-vous lui donner ?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-soft-lg border border-primary/20">
      {/* En-tête */}
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-secondary">Création d'histoire</h2>
            <p className="text-sm text-muted-foreground">Définissons ensemble votre histoire</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" aria-label="Réinitialiser">
              <RefreshCcw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Aide">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Zone de messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
      </ScrollArea>

      {/* Zone de saisie */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-primary/20">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Décrivez votre histoire idéale..."
            className="flex-1 bg-transparent border-primary/20 focus:border-primary"
          />
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StoryChat;