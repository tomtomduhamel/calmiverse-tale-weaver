
import React from "react";
import { Tag, AlertCircle } from "lucide-react";
import type { Story } from "@/types/story";

interface StoryCardTagsProps {
  tags: string[];
  objective: Story['objective'];
  status: 'pending' | 'completed' | 'read' | 'error';
  error?: string;
}

const StoryCardTags: React.FC<StoryCardTagsProps> = ({ tags, objective, status, error }) => {
  const getObjectiveText = (objective: Story['objective']) => {
    if (typeof objective === 'string') {
      return objective;
    }
    return objective?.value || "Objectif non défini";
  };

  const getStatusColor = (status: Story['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'read':
        return 'bg-blue-200 text-blue-800';
      case 'error':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusText = (status: Story['status']) => {
    switch (status) {
      case 'pending':
        return 'En cours';
      case 'completed':
        return 'Prêt pour la lecture';
      case 'read':
        return 'Lu';
      case 'error':
        return 'Erreur';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="text-xs bg-secondary/20 text-secondary-dark px-2 py-1 rounded-full">
        {getObjectiveText(objective)}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)} flex items-center gap-1`}>
        {status === 'error' && <AlertCircle className="w-3 h-3" />}
        {getStatusText(status)}
      </span>
      {tags?.map((tag, index) => (
        <span key={index} className="text-xs bg-accent/20 text-accent-dark px-2 py-1 rounded-full flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {tag}
        </span>
      ))}
      
      {status === 'error' && error && (
        <div className="w-full mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default StoryCardTags;
