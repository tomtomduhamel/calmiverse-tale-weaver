import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Layers } from 'lucide-react';

interface SeriesIndicatorProps {
  tomeNumber?: number | null;
  seriesTitle?: string;
  isSeriesStarter?: boolean;
  className?: string;
}

export const SeriesIndicator: React.FC<SeriesIndicatorProps> = ({
  tomeNumber,
  seriesTitle,
  isSeriesStarter,
  className = ""
}) => {
  if (!tomeNumber) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="secondary" 
        className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
      >
        <Layers className="w-3 h-3 mr-1" />
        Tome {tomeNumber}
      </Badge>
      
      {isSeriesStarter && (
        <Badge 
          variant="outline" 
          className="bg-accent/10 text-accent-foreground border-accent/30"
        >
          <BookOpen className="w-3 h-3 mr-1" />
          Début de série
        </Badge>
      )}
    </div>
  );
};