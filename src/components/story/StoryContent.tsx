
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Story } from '@/types/story';

interface StoryContentProps {
  story: Story;
  fontSize: number;
  isDarkMode: boolean;
}

export const StoryContent: React.FC<StoryContentProps> = ({ 
  story, 
  fontSize,
  isDarkMode 
}) => {
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  
  return (
    <div 
      className={`prose max-w-none ${textColor}`}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: 1.6
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className={`text-2xl font-bold mt-8 mb-4 ${textColor}`} {...props} />,
          h2: ({ node, ...props }) => <h2 className={`text-xl font-bold mt-6 mb-3 ${textColor}`} {...props} />,
          p: ({ node, ...props }) => <p className={`my-4 ${textColor}`} {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 my-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className={`border-l-4 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} pl-4 py-2 my-4 italic`} 
              {...props} 
            />
          ),
        }}
      >
        {story.story_text}
      </ReactMarkdown>
    </div>
  );
};
