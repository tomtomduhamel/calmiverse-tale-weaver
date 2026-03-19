import React from 'react';
import { FastStoryItem } from '@/config/fastStoryConfig';
import { cn } from '@/lib/utils';

interface FastStoryCardProps {
  item: FastStoryItem;
  onClick: (item: FastStoryItem) => void;
  disabled?: boolean;
}

const FastStoryCard: React.FC<FastStoryCardProps> = ({ item, onClick, disabled = false }) => {
  return (
    <button
      onClick={() => !disabled && onClick(item)}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center transition-all duration-300',
        'border border-white/10 bg-gradient-to-br backdrop-blur-sm',
        'hover:scale-[1.04] hover:shadow-lg hover:border-white/20 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        item.gradientFrom,
        item.gradientTo,
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
      )}
    >
      {/* Icon */}
      <span
        className="text-3xl transition-transform duration-300 group-hover:scale-110"
        role="img"
        aria-label={item.label}
      >
        {item.icon}
      </span>

      {/* Label */}
      <span className="text-sm font-semibold leading-tight text-foreground/90">
        {item.label}
      </span>
    </button>
  );
};

export default FastStoryCard;
