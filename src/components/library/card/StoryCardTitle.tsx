import React from "react";
import { Input } from "@/components/ui/input";

interface StoryCardTitleProps {
  isEditing: boolean;
  title: string;
  editingTitle: string;
  onEditingTitleChange: (value: string) => void;
}

const StoryCardTitle: React.FC<StoryCardTitleProps> = ({
  isEditing,
  title,
  editingTitle,
  onEditingTitleChange,
}) => {
  const formatTitle = (text: string) => {
    // Enlever les guillemets au début et à la fin
    let formattedText = text.replace(/^"|"$/g, '').trim();

    // Gérer les titres avec ###
    if (formattedText.startsWith('###')) {
      return (
        <h3 className="text-xl font-bold text-secondary-dark">
          {formattedText.replace(/^###\s*/, '')}
        </h3>
      );
    }
    
    // Gérer le texte en gras avec **
    if (formattedText.startsWith('**') && formattedText.endsWith('**')) {
      return (
        <h3 className="text-lg font-semibold text-secondary-dark">
          {formattedText.replace(/^\*\*|\*\*$/g, '')}
        </h3>
      );
    }

    // Texte normal
    return (
      <h3 className="text-base font-medium text-secondary-dark">
        {formattedText}
      </h3>
    );
  };

  return isEditing ? (
    <Input
      value={editingTitle}
      onChange={(e) => onEditingTitleChange(e.target.value)}
      className="font-semibold"
      onClick={(e) => e.stopPropagation()}
      autoFocus
    />
  ) : (
    formatTitle(title)
  );
};

export default StoryCardTitle;