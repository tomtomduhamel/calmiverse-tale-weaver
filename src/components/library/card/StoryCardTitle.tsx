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
  return isEditing ? (
    <Input
      value={editingTitle}
      onChange={(e) => onEditingTitleChange(e.target.value)}
      className="mb-2 font-semibold"
      onClick={(e) => e.stopPropagation()}
      autoFocus
    />
  ) : (
    <h3 className="text-lg font-semibold mb-2 text-secondary-dark">
      {title}
    </h3>
  );
};

export default StoryCardTitle;