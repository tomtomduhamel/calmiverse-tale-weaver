
import React from 'react';
import { FavoriteButton } from '../FavoriteButton';

interface FavoriteReaderButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export const FavoriteReaderButton: React.FC<FavoriteReaderButtonProps> = ({
  isFavorite,
  onToggle,
  isLoading = false
}) => {
  return (
    <FavoriteButton
      isFavorite={isFavorite}
      onToggle={onToggle}
      isLoading={isLoading}
      size="md"
      variant="ghost"
      className="text-gray-600 hover:text-amber-400"
    />
  );
};
