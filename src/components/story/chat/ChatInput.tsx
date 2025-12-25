import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Écrivez votre message...",
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="
            w-full resize-none rounded-xl border border-border/50 
            bg-muted/30 px-4 py-3 text-sm
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-[48px] max-h-[120px]
          "
          style={{ overflow: 'hidden' }}
        />
      </div>
      
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !value.trim()}
        className="h-12 w-12 rounded-xl shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default ChatInput;
