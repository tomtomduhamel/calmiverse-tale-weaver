import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useN8nChatbotStory } from '@/hooks/n8n/useN8nChatbotStory';
import type { Child } from '@/types/child';
import ChatMessageBubble from './ChatMessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

interface ChatStoryCreatorProps {
  children: Child[];
  onBack: () => void;
}

const ChatStoryCreator: React.FC<ChatStoryCreatorProps> = ({ children, onBack }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    storyId,
    isInitialized,
    initConversation,
    sendMessage,
    resetConversation,
    selectChoice,
    confirmChoices,
  } = useN8nChatbotStory();

  const handleReset = () => {
    resetConversation();
    // Réinitialiser avec les mêmes enfants
    if (user && children.length > 0) {
      setTimeout(() => {
        initConversation(user.id, children);
      }, 100);
    }
  };

  // Ref stable pour initConversation (évite les re-renders en boucle)
  const initConversationRef = useRef(initConversation);
  initConversationRef.current = initConversation;

  // Initialiser la conversation au montage (une seule fois)
  useEffect(() => {
    if (user && children.length > 0 && !isInitialized) {
      console.log('[ChatStoryCreator] Initialisation avec', children.length, 'enfants');
      initConversationRef.current(user.id, children);
    }
  }, [user, children.length, isInitialized]); // PAS initConversation dans les deps

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Redirection vers le reader quand l'histoire est créée
  useEffect(() => {
    if (storyId) {
      console.log('[ChatStoryCreator] Redirection vers reader:', storyId);
      // Petit délai pour laisser l'utilisateur voir le message final
      const timer = setTimeout(() => {
        navigate(`/reader/${storyId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [storyId, navigate]);

  const handleSend = (message: string) => {
    if (user) {
      sendMessage(message, user.id);
    }
  };

  const handleConfirmChoices = (messageId: string) => {
    if (user) {
      confirmChoices(messageId, user.id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Mode guidé
        </Button>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">Création assistée par Calmi</span>
        </div>
      </div>

      {/* Chat Card */}
      <Card className="border-border/50 shadow-lg overflow-hidden">
        {/* Chat Header */}
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Calmi</h3>
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'En train d\'écrire...' : 'Assistant de création d\'histoires'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {storyId && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                  ✓ Histoire créée
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
                className="text-primary/70 hover:text-primary hover:bg-primary/10 gap-1.5"
                title="Recommencer la conversation"
              >
                <RotateCcw className="h-5 w-5" />
                <span className="hidden sm:inline text-xs">Recommencer</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="p-0">
          <ScrollArea ref={scrollAreaRef} className="h-[400px] p-4">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-3 text-primary/40" />
                  <p>Connexion avec Calmi...</p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <ChatMessageBubble 
                key={message.id} 
                message={message}
                onSelectChoice={selectChoice}
                onConfirmChoices={handleConfirmChoices}
                disabled={isLoading}
              />
            ))}
            
            {isLoading && <TypingIndicator />}
          </ScrollArea>

          {/* Input Area */}
          <ChatInput
            onSend={handleSend}
            disabled={isLoading || !!storyId}
            placeholder={storyId ? "Histoire créée ! Redirection..." : "Écrivez votre message..."}
          />
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>Discutez avec Calmi pour créer une histoire personnalisée.</p>
        <p>Il vous posera des questions sur le titre, les personnages et l'univers de l'histoire.</p>
      </div>
    </div>
  );
};

export default ChatStoryCreator;
