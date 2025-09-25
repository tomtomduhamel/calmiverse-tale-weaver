
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
  // Utiliser les tokens sémantiques pour les couleurs au lieu de couleurs directes
  const textColor = 'text-foreground';
  
  // Si l'histoire est en cours de régénération, afficher un indicateur
  if (story.status === 'regenerating') {
    return (
      <div className={`prose max-w-none ${textColor} transition-all animate-pulse`} 
           style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-medium text-foreground">Régénération de l'histoire en cours...</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Nous actualisons l'histoire avec les nouveaux paramètres.
          </p>
        </div>
        
        {/* Afficher le texte existant mais avec une opacité réduite */}
        <div className="opacity-30">
          <ReactMarkdown>
            {story.content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`prose max-w-none ${textColor} transition-all duration-700`}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: 1.6,
        textAlign: 'justify'
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground text-center" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 text-foreground text-center" {...props} />,
          p: ({ node, ...props }) => <p className="my-4 text-foreground" style={{ textAlign: 'justify' }} {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 my-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-border bg-muted pl-4 py-2 my-4 italic text-muted-foreground" 
              {...props} 
            />
          ),
        }}
      >
        {story.content}
      </ReactMarkdown>
    </div>
  );
};
