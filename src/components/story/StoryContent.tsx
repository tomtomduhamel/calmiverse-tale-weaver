
import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Story } from '@/types/story';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useReadingProgress } from '@/hooks/story/reader/useReadingProgress';
import { useReadingSpeed } from '@/contexts/ReadingSpeedContext';

interface StoryContentProps {
  story: Story;
  fontSize: number;
  isDarkMode: boolean;
  isAutoScrolling?: boolean;
  isPaused?: boolean;
  isManuallyPaused?: boolean;
}

export const StoryContent: React.FC<StoryContentProps> = ({ 
  story, 
  fontSize,
  isDarkMode,
  isAutoScrolling = false,
  isPaused = false,
  isManuallyPaused = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [totalWords, setTotalWords] = useState(0);

  const { userSettings } = useUserSettings();
  const immersiveMode = userSettings.readingPreferences?.immersiveReadingMode || 'pulse';
  // Lire la vitesse depuis ReadingSpeedContext (même source que useAutoScroll)
  // pour garantir la synchronisation parfaite entre défilement et surlignage
  const { readingSpeed } = useReadingSpeed();

  const { currentWordIndex } = useReadingProgress({
    isAutoScrolling,
    isPaused,
    isManuallyPaused,
    readingSpeed,
    totalWords
  });

  // Tokenisation du DOM (Wrapped words in spans pour la performance)
  useEffect(() => {
    if (!contentRef.current || story.status === 'regenerating') return;
    if (contentRef.current.hasAttribute('data-tokenized')) return;

    // Reset before tokenizing in case of re-mount
    const blocks = contentRef.current.querySelectorAll('p, h1, h2, h3, li');
    
    let wordIdx = 0;
    let paraIdx = 0;

    blocks.forEach((block) => {
      block.setAttribute('data-paragraph-index', paraIdx.toString());
      
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue?.trim()) {
          textNodes.push(node as Text);
        }
      }
      
      textNodes.forEach((textNode) => {
        const words = textNode.nodeValue!.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        
        words.forEach((word) => {
          if (word.trim()) {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'story-word transition-all duration-150 inline-block';
            span.setAttribute('data-word-index', wordIdx.toString());
            span.setAttribute('data-paragraph-index', paraIdx.toString());
            fragment.appendChild(span);
            wordIdx++;
          } else {
            fragment.appendChild(document.createTextNode(word));
          }
        });
        
        textNode.parentNode?.replaceChild(fragment, textNode);
      });
      
      paraIdx++;
    });

    setTotalWords(wordIdx);
    contentRef.current.setAttribute('data-tokenized', 'true');
  }, [story.content, story.status]);

  // Réinitialisation de la tokenisation si l'histoire change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.removeAttribute('data-tokenized');
    }
  }, [story.id, story.content]);

  // Effets visuels (Mise à jour DOM sans re-render React pour max perf)
  useEffect(() => {
    if (!contentRef.current || immersiveMode === 'none') {
      // Nettoyage si on désactive le mode
      if (contentRef.current && contentRef.current.hasAttribute('data-tokenized')) {
        const allWords = contentRef.current.querySelectorAll('.story-word');
        const allBlocks = contentRef.current.querySelectorAll('[data-paragraph-index]');
        allWords.forEach(w => {
           (w as HTMLElement).style.cssText = 'transition: all 150ms ease-in-out;';
           w.className = 'story-word transition-all duration-150 inline-block';
        });
        allBlocks.forEach(b => {
           (b as HTMLElement).style.opacity = '1';
        });
      }
      return;
    }

    const allWords = contentRef.current.querySelectorAll('.story-word');
    const allBlocks = contentRef.current.querySelectorAll('[data-paragraph-index]');

    // Si on n'a pas encore commencé
    if (currentWordIndex === -1) {
      allWords.forEach(w => {
        w.className = 'story-word transition-all duration-150 inline-block';
        (w as HTMLElement).style.color = '';
      });
      allBlocks.forEach(b => {
        (b as HTMLElement).style.opacity = '1';
      });
      return;
    }

    const activeWordSpan = contentRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`) as HTMLElement;
    const currentParaIndex = activeWordSpan?.getAttribute('data-paragraph-index') || '-1';

    // Appliquer les styles selon le mode
    if (immersiveMode === 'pulse') {
      allWords.forEach((wordElement) => {
        const w = wordElement as HTMLElement;
        const wIdx = parseInt(w.getAttribute('data-word-index') || '0', 10);
        
        if (wIdx === currentWordIndex) {
          w.className = 'story-word transition-all duration-150 inline-block bg-primary/20 text-primary font-medium rounded px-1 -mx-1';
        } else {
          w.className = 'story-word transition-all duration-150 inline-block';
        }
      });
      allBlocks.forEach(b => { (b as HTMLElement).style.opacity = '1'; });
    } 
    else if (immersiveMode === 'karaoke') {
      const isCurrentlyPaused = isPaused || isManuallyPaused || !isAutoScrolling;
      allBlocks.forEach((blockElement) => {
        const b = blockElement as HTMLElement;
        const pIdx = b.getAttribute('data-paragraph-index');
        b.style.opacity = (pIdx === currentParaIndex || currentWordIndex === -1 || isCurrentlyPaused) ? '1' : '0.4';
        b.style.transition = 'opacity 300ms ease-in-out';
      });

      allWords.forEach((wordElement) => {
        const w = wordElement as HTMLElement;
        const wIdx = parseInt(w.getAttribute('data-word-index') || '0', 10);
        
        if (wIdx === currentWordIndex) {
          w.className = 'story-word transition-all duration-150 inline-block text-primary font-bold scale-105';
        } else if (wIdx < currentWordIndex && w.getAttribute('data-paragraph-index') === currentParaIndex) {
          // Traînée magique dans le même paragraphe
          w.className = 'story-word transition-all duration-150 inline-block text-primary/70';
        } else {
          w.className = 'story-word transition-all duration-150 inline-block';
        }
      });
    }
    else if (immersiveMode === 'brush') {
      allBlocks.forEach(b => { (b as HTMLElement).style.opacity = '1'; });
      
      allWords.forEach((wordElement) => {
        const w = wordElement as HTMLElement;
        const wIdx = parseInt(w.getAttribute('data-word-index') || '0', 10);
        
        if (wIdx <= currentWordIndex) {
          w.className = 'story-word transition-all duration-300 inline-block text-primary';
        } else {
          w.className = 'story-word transition-all duration-300 inline-block';
        }
      });
    }

  }, [currentWordIndex, immersiveMode, isPaused, isManuallyPaused, isAutoScrolling]);

  // Memoize markdown to prevent re-renders losing DOM manipulations
  const memoizedMarkdown = useMemo(() => (
    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground text-center" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 text-foreground text-center" {...props} />,
        p: ({ node, ...props }) => <p className="my-4 text-foreground relative z-10" style={{ textAlign: 'justify' }} {...props} />,
        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc ml-6 my-4 relative z-10" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 my-4 relative z-10" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        a: ({ node, ...props }) => <a className="text-primary hover:underline relative z-10" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-border bg-muted pl-4 py-2 my-4 italic text-muted-foreground relative z-10" {...props} />
        ),
      }}
    >
      {story.content}
    </ReactMarkdown>
  ), [story.content]);

  const textColor = 'text-foreground';
  
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
        
        <div className="opacity-30">
          <ReactMarkdown>{story.content}</ReactMarkdown>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={contentRef}
      className={`prose max-w-none ${textColor} transition-all duration-700 reader-content-container`}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: 1.8, // Slightly higher line-height for better highlighting space
        textAlign: 'justify'
      }}
    >
      {memoizedMarkdown}
    </div>
  );
};
