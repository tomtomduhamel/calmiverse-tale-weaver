import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Story } from "@/types/story";

interface StoryContentProps {
  story: Story;
  fontSize: number;
  isDarkMode: boolean;
}

export const StoryContent: React.FC<StoryContentProps> = ({
  story,
  fontSize,
  isDarkMode,
}) => {
  const getObjectiveText = (objective: Story['objective']) => {
    if (!objective) return "Objectif non défini";
    
    if (typeof objective === 'object' && objective.value) {
      return objective.value;
    }
    
    if (typeof objective === 'string') {
      return objective;
    }

    return "Objectif non défini";
  };

  return (
    <>
      <div className="mb-6 bg-secondary/10 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Objectif de l'histoire</h3>
        <ReactMarkdown className="text-muted-foreground">{getObjectiveText(story.objective)}</ReactMarkdown>
      </div>

      <div
        style={{ fontSize: `${fontSize}px` }}
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert animate-fade-in"
      >
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-secondary pl-4 italic my-4" {...props} />
            ),
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          }}
        >
          {story.story_text}
        </ReactMarkdown>
      </div>
    </>
  );
};