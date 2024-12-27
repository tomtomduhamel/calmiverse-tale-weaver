import React from "react";
import { Tag } from "lucide-react";

interface StoryCardTagsProps {
  tags: string[];
  objective: string;
  status: 'pending' | 'completed';
}

const StoryCardTags: React.FC<StoryCardTagsProps> = ({ tags, objective, status }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="text-xs bg-secondary/20 text-secondary-dark px-2 py-1 rounded-full">
        {objective}
      </span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        status === 'pending' 
          ? 'bg-yellow-200 text-yellow-800' 
          : 'bg-green-200 text-green-800'
      }`}>
        {status === 'pending' ? 'En cours' : 'Terminée'}
      </span>
      {tags?.map((tag, index) => (
        <span key={index} className="text-xs bg-accent/20 text-accent-dark px-2 py-1 rounded-full flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {tag}
        </span>
      ))}
    </div>
  );
};

export default StoryCardTags;