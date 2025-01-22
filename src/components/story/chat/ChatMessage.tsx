import React from 'react';
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.type === 'ai';
  
  return (
    <div
      className={cn(
        "animate-fade-in max-w-[80%] mb-4",
        isAI ? "ml-0" : "ml-auto"
      )}
    >
      <div
        className={cn(
          "rounded-xl p-4 shadow-soft",
          isAI 
            ? "bg-white/90 border border-primary/20" 
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
      </div>
      <time className={cn(
        "text-xs text-muted-foreground mt-1 block",
        isAI ? "text-left" : "text-right"
      )}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
    </div>
  );
};

export default ChatMessage;