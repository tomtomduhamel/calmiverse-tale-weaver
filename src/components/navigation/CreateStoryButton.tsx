import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateStoryButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

const CreateStoryButton: React.FC<CreateStoryButtonProps> = ({ 
  variant = "default",
  size = "default", 
  className = "",
  children
}) => {
  const navigate = useNavigate();

  const handleCreateStory = () => {
    navigate('/create-story/step-1');
  };

  return (
    <Button 
      onClick={handleCreateStory}
      variant={variant}
      size={size}
      className={className}
    >
      <Plus className="w-4 h-4 mr-2" />
      {children || "Créer une histoire"}
    </Button>
  );
};

export default CreateStoryButton;