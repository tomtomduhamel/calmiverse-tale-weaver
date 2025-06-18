
import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  isLoading = false,
  size = 'md',
  variant = 'ghost',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            onClick={onToggle}
            disabled={isLoading}
            className={`${sizeClasses[size]} ${className} transition-all duration-200 hover:scale-110`}
          >
            <Star
              className={`${iconSizes[size]} transition-colors duration-200 ${
                isFavorite 
                  ? 'text-amber-400 fill-amber-400' 
                  : 'text-gray-400 hover:text-amber-300'
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
