import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Compass, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReadItem {
  id: string;
  story_id: string;
  read_at: string;
  story: {
    title: string;
    objective: string | null;
  } | null;
}

interface StarLogbookProps {
  recentReads: ReadItem[];
}

export const StarLogbook: React.FC<StarLogbookProps> = ({ recentReads }) => {
  return (
    <div className="p-6 rounded-2xl bg-white/50 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm h-full flex flex-col transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-5 h-5 text-secondary" />
        <h3 className="text-lg font-medium text-foreground dark:text-white">Carnet Stellaire</h3>
      </div>
      
      <ScrollArea className="flex-1 -mx-4 px-4 text-foreground dark:text-white">
        {recentReads.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <p className="text-sm">Aucune exploration récente enregistrée.</p>
          </div>
        ) : (
          <div className="space-y-4 pr-3">
            {recentReads.map((item, index) => (
              <div 
                key={item.id} 
                className="flex flex-col p-3 rounded-lg border border-primary/5 bg-primary/5 dark:border-white/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm text-foreground dark:text-white line-clamp-1">
                    {item.story?.title || "Histoire inconnue"}
                  </h4>
                  <span className="flex items-center text-[10px] text-muted-foreground dark:text-white/60 ml-2 shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(item.read_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
                {item.story?.objective && (
                  <span className="text-[10px] bg-accent/10 dark:bg-accent/20 text-accent-foreground dark:text-accent-foreground px-2 py-0.5 rounded-full w-fit mt-1">
                    {item.story.objective}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
