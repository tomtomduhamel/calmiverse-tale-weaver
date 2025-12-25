import React from 'react';
import type { ChatbotMessage } from '@/types/chatbot';
import { Bot, User } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: ChatbotMessage;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex items-start gap-3 mb-4 animate-fade-in ${
        isAssistant ? '' : 'flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isAssistant 
            ? 'bg-primary/10 text-primary' 
            : 'bg-secondary text-secondary-foreground'
          }
        `}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      {/* Bulle de message */}
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 shadow-soft
          ${isAssistant
            ? 'bg-card border border-border/50 text-foreground rounded-tl-sm'
            : 'bg-primary text-primary-foreground rounded-tr-sm'
          }
        `}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <span
          className={`
            text-[10px] mt-1 block
            ${isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/70'}
          `}
        >
          {message.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
